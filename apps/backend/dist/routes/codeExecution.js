"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const client_1 = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const judge0_service_1 = require("../services/judge0.service");
const errorClassifier_service_1 = require("../services/errorClassifier.service");
const router = express.Router();
const prisma = new client_1.PrismaClient();
const { updateBKTLocal } = require("../services/bkt.service");
// Language ID mapping for Judge0
const languageIds = {
    python: 71,
    javascript: 63,
    java: 62,
    cpp: 54
};
// Run code against sample test cases
router.post("/:id/run", authenticateToken, async (req, res) => {
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
        let lastResult = null;
        for (const testCase of problem.testCases) {
            try {
                const result = await (0, judge0_service_1.runCode)(code, languageIds[language], testCase.input);
                lastResult = result;
                const passed = result.stdout?.trim() === testCase.output.trim();
                if (passed)
                    passedCount++;
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
            }
            catch (error) {
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
    }
    catch (error) {
        console.error("Run code error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
// Submit solution for evaluation
router.post("/:id/submit", authenticateToken, async (req, res) => {
    try {
        const { id: problemId } = req.params;
        const { code, language } = req.body;
        const userId = req.user.userId;
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
        // Run code against all test cases
        let passedCount = 0;
        let totalRuntime = 0;
        let maxMemory = 0;
        let status = "accepted";
        let lastResult = null;
        for (const testCase of problem.testCases) {
            try {
                const result = await (0, judge0_service_1.runCode)(code, languageIds[language], testCase.input);
                lastResult = result;
                if (result.stderr) {
                    status = result.status_id === 5 ? "time_limit_exceeded" : "runtime_error";
                    break;
                }
                const passed = result.stdout?.trim() === testCase.output.trim();
                if (passed) {
                    passedCount++;
                }
                else {
                    status = "wrong_answer";
                }
                totalRuntime += parseFloat(result.time || "0");
                maxMemory = Math.max(maxMemory, parseInt(result.memory || "0"));
            }
            catch (error) {
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
        // Record error if compilation or runtime error occurred
        if (lastResult && (lastResult.compile_output || lastResult.stderr)) {
            try {
                await (0, errorClassifier_service_1.recordSubmissionError)({
                    submissionId: submission.id,
                    language,
                    compileOutput: lastResult.compile_output,
                    stderr: lastResult.stderr
                });
            }
            catch (e) {
                console.error('Error recording submission error:', e);
                // Don't fail the submission if error recording fails
            }
        }
        // Update BKT states for knowledge components associated with this problem
        try {
            // problem.knowledgeComponents is an array of KC names
            const kcNames = problem.knowledgeComponents || [];
            for (const kcName of kcNames) {
                // call local BKT updater; ignore failures so submission flow isn't blocked
                try {
                    await updateBKTLocal(userId, kcName, status === 'accepted');
                }
                catch (e) {
                    console.error('BKT update failed for', kcName, e);
                }
            }
        }
        catch (e) {
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
        res.json({
            submissionId: submission.id,
            status: submission.status,
            testCasesPassed: submission.testCasesPassed,
            totalTestCases: submission.totalTestCases,
            runtime: submission.runtime,
            memory: submission.memory,
            compileOutput: submission.compileOutput,
            stderr: submission.stderr,
            submittedAt: submission.submittedAt
        });
    }
    catch (error) {
        console.error("Submit code error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
module.exports = router;
//# sourceMappingURL=codeExecution.js.map