const express = require("express");
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const { authenticateToken } = require("../middleware/auth");
import { runCode } from "../services/judge0.service";
import { recordSubmissionError, recordLogicError } from "../services/errorClassifier.service";

const router = express.Router();
const prisma = new PrismaClient();
const { updateBKTLocal } = require("../services/bkt.service");

// Language ID mapping for Judge0
const languageIds: Record<string, number> = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54
};

// Run code against sample test cases
router.post("/:id/run", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id: problemId } = req.params;
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: "Code and language are required" });
    }

    if (!languageIds[language]) {
      return res.status(400).json({ message: "Unsupported language" });
    }

    // Validate problemId
    if (!problemId) {
      return res.status(400).json({ message: "Problem ID is required" });
    }

    // Get problem with public test cases
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        testCases: {
          where: { isHidden: false }
        }
      }
    });

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    if (!problem.testCases || problem.testCases.length === 0) {
      return res.status(400).json({ 
        message: "No test cases available for this problem",
        error: "This problem has not been configured with test cases yet. Please contact an instructor."
      });
    }

  // Run code against each public test case
  const results = [];
  let passedCount = 0;
  let lastResult: any = null;

    for (const testCase of problem.testCases) {
      try {
  const result = await runCode(code, languageIds[language], testCase.input);
  lastResult = result;
        
        const passed = result.stdout?.trim() === testCase.output.trim();
        if (passed) passedCount++;

        results.push({
          testCaseId: testCase.id,
          passed,
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: result.stdout,
          error: result.stderr,
          compileOutput: result.compile_output,
          runtime: result.time,
          memory: result.memory
        });
      } catch (error) {
        results.push({
          testCaseId: testCase.id,
          passed: false,
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: null,
          error: "Execution failed",
          runtime: null,
          memory: null
        });
      }
    }

  const allPassed = passedCount === problem.testCases.length;

    res.json({
      status: allPassed ? "Accepted" : "Failed",
      testCasesPassed: passedCount,
      totalTestCases: problem.testCases.length,
      results,
      compileOutput: lastResult?.compile_output ?? null,
      stderr: lastResult?.stderr ?? null,
      message: allPassed 
        ? "All test cases passed!" 
        : `${passedCount}/${problem.testCases.length} test cases passed`
    });
  } catch (error) {
    console.error("Run code error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Submit solution for evaluation
router.post("/:id/submit", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id: problemId } = req.params;
    const { code, language } = req.body;
    const userId = (req as any).user.userId;

    if (!code || !language) {
      return res.status(400).json({ message: "Code and language are required" });
    }

    if (!languageIds[language]) {
      return res.status(400).json({ message: "Unsupported language" });
    }

    // Validate problemId
    if (!problemId) {
      return res.status(400).json({ message: "Problem ID is required" });
    }

    // Get problem with all test cases (including hidden ones) and knowledge components
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        testCases: true
      }
    });

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    if (!problem.testCases || problem.testCases.length === 0) {
      return res.status(400).json({ 
        message: "Cannot submit solution",
        error: "This problem has not been configured with test cases yet. Please contact an instructor."
      });
    }

  // Run code against all test cases
  let passedCount = 0;
  let totalRuntime = 0;
  let maxMemory = 0;
  let status = "accepted";
  let lastResult: any = null;

    for (const testCase of problem.testCases) {
      try {
        const result = await runCode(code, languageIds[language], testCase.input);
        lastResult = result;

        if (result.stderr) {
          status = result.status_id === 5 ? "time_limit_exceeded" : "runtime_error";
          break;
        }

        const passed = result.stdout?.trim() === testCase.output.trim();
        if (passed) {
          passedCount++;
        } else {
          status = "wrong_answer";
        }

        totalRuntime += parseFloat(result.time || "0");
        maxMemory = Math.max(maxMemory, parseInt(result.memory || "0"));
      } catch (error) {
        status = "compilation_error";
        break;
      }
    }

    // Create submission record
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        code,
        language,
        status,
        testCasesPassed: passedCount,
        totalTestCases: problem.testCases.length,
        runtime: totalRuntime / problem.testCases.length,
        memory: maxMemory,
        compileOutput: lastResult?.compile_output ?? null,
        stderr: lastResult?.stderr ?? null,
        judgeStatusId: lastResult?.status_id ?? null,
        submittedAt: new Date()
      }
    });

    // Record error: compiler/runtime or logic (wrong_answer)
    try {
      if (lastResult && (lastResult.compile_output || lastResult.stderr)) {
        await recordSubmissionError({
          submissionId: submission.id,
          language,
          compileOutput: lastResult.compile_output,
          stderr: lastResult.stderr,
          code // include the submitted code so the AI can analyze it together with the error
        });
      } else if (status === "wrong_answer") {
        // Re-run to identify the first failing test case to provide precise logic error context
        const langId = languageIds[language] as number;
        let failingInput = "";
        let expectedOutput = "";
        let actualOutput = "";
        try {
          for (const tc of problem.testCases as any[]) {
            const r = await runCode(code, langId, tc.input);
            const passed = r.stdout?.trim() === tc.output.trim();
            if (!passed) {
              failingInput = tc.input;
              expectedOutput = tc.output;
              actualOutput = (r.stdout || "").toString();
              break;
            }
          }
        } catch (e) {
          // best effort; fall back to lastResult
          failingInput = "";
          expectedOutput = "";
          actualOutput = lastResult?.stdout || "";
        }
        await recordLogicError({
          submissionId: submission.id,
          language,
          code,
          failingInput,
          expectedOutput,
          actualOutput,
          problemDescription: problem.description
        });
      }
    } catch (e) {
      console.error('Error recording submission error:', e);
      // Don't fail the submission if error recording fails
    }

      // Update BKT states for knowledge components associated with this problem
      try {
        // problem.knowledgeComponents is an array of KC names
        const kcNames: string[] = (problem as any).knowledgeComponents || [];
        for (const kcName of kcNames) {
          // call local BKT updater; ignore failures so submission flow isn't blocked
          try {
            await updateBKTLocal(userId, kcName, status === 'accepted');
          } catch (e) {
            console.error('BKT update failed for', kcName, e);
          }
        }
      } catch (e) {
        console.error('Error updating BKT states:', e);
      }

    // Update problem statistics
    const isAccepted = status === "accepted";
    await prisma.problem.update({
      where: { id: problemId },
      data: {
        totalSubmissions: { increment: 1 },
        acceptanceRate: isAccepted 
          ? ((problem.acceptanceRate * (problem.totalSubmissions || 0)) + 100) / ((problem.totalSubmissions || 0) + 1)
          : (problem.acceptanceRate * (problem.totalSubmissions || 0)) / ((problem.totalSubmissions || 0) + 1)
      }
    });

    // Fetch error classification if submission failed
    let errorClassification = null;
    if (status !== "accepted") {
      try {
        const submissionError = await prisma.submissionError.findUnique({
          where: { submissionId: submission.id },
          include: {
            signature: {
              select: {
                surfaceError: true,
                cognitiveCause: true,
                bloomLevel: true,
                reasoning: true,
                specificError: true
              }
            }
          }
        });

        if (submissionError && submissionError.signature) {
          errorClassification = {
            id: submissionError.id,
            surfaceError: submissionError.signature.surfaceError || '',
            cognitiveCause: submissionError.signature.cognitiveCause || '',
            bloomLevel: submissionError.signature.bloomLevel || '',
            suggestion: submissionError.signature.reasoning || '',
            errorPattern: submissionError.signature.specificError || ''
          };
        }
      } catch (e) {
        console.error('Error fetching error classification:', e);
        // Continue without error classification
      }
    }

    res.json({
      submissionId: submission.id,
      status: submission.status,
      testCasesPassed: submission.testCasesPassed,
      totalTestCases: submission.totalTestCases,
      runtime: submission.runtime,
      memory: submission.memory,
      compileOutput: submission.compileOutput,
      stderr: submission.stderr,
      submittedAt: submission.submittedAt,
      error: errorClassification
    });
  } catch (error) {
    console.error("Submit code error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;