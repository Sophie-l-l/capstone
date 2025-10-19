const express = require("express");
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const { authenticateToken } = require("../middleware/auth");
import { runCode } from "../services/judge0.service";

const router = express.Router();
const prisma = new PrismaClient();

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

    if (problem.testCases.length === 0) {
      return res.status(400).json({ message: "No test cases available for this problem" });
    }

    // Run code against each public test case
    const results = [];
    let passedCount = 0;

    for (const testCase of problem.testCases) {
      try {
        const result = await runCode(code, languageIds[language], testCase.input);
        
        const passed = result.stdout?.trim() === testCase.output.trim();
        if (passed) passedCount++;

        results.push({
          testCaseId: testCase.id,
          passed,
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: result.stdout,
          error: result.stderr,
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

    // Get problem with all test cases (including hidden ones)
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        testCases: true
      }
    });

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Run code against all test cases
    let passedCount = 0;
    let totalRuntime = 0;
    let maxMemory = 0;
    let status = "accepted";

    for (const testCase of problem.testCases) {
      try {
        const result = await runCode(code, languageIds[language], testCase.input);
        
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
        submittedAt: new Date()
      }
    });

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

    res.json({
      submissionId: submission.id,
      status: submission.status,
      testCasesPassed: submission.testCasesPassed,
      totalTestCases: submission.totalTestCases,
      runtime: submission.runtime,
      memory: submission.memory,
      submittedAt: submission.submittedAt
    });
  } catch (error) {
    console.error("Submit code error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;