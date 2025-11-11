const express = require("express");
import type { Request, Response } from "express";
const { authenticateToken } = require("../middleware/auth");
const { classifyWithAI, recordSubmissionError, recordLogicError } = require("../services/errorClassifier.service");

const router = express.Router();

// POST /api/errors/analyze
// Body: { code?: string, stderr?: string, compileOutput?: string, language?: string, persist?: boolean, submissionId?: string }
router.post("/analyze", authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      code = "",
      stderr = "",
      compileOutput = "",
      language = null,
      persist = false,
      submissionId = null,
      // New optional logic error context
      test_case_input = null,
      expected_output = null,
      actual_output = null,
      problem_description = null
    } = req.body || {};

    const outputText = (compileOutput || stderr || "").trim();
    const codeText = (code || "").trim();
    const combined = (codeText ? `Code:\n${codeText}\n\nError:\n${outputText}` : outputText).trim();

    // Determine if this is a logic-only error (no stderr/compile output but test case mismatch present)
    const isLogicError = !outputText && expected_output && actual_output && expected_output !== actual_output;

    let aiResult;
    if (isLogicError) {
      // Use logic error classification pathway
      aiResult = await classifyWithAI(`Logic error: expected ${expected_output} got ${actual_output}`,
        language,
        {
          code: codeText,
          test_case_input,
          expected_output,
          actual_output,
          problem_description
        }
      );
    } else {
      if (!combined) {
        return res.status(400).json({ message: "code or error output is required" });
      }
      aiResult = await classifyWithAI(combined, language, { code: codeText });
    }

    // Persist classification (compiler/runtime or logic) if requested
    if (persist && submissionId) {
      try {
        if (isLogicError) {
          await recordLogicError({
            submissionId,
            language: language || "unknown",
            code: codeText,
            failingInput: test_case_input || "",
            expectedOutput: expected_output || "",
            actualOutput: actual_output || "",
            problemDescription: problem_description || null
          });
        } else {
          await recordSubmissionError({
            submissionId,
            language: language || "unknown",
            compileOutput: compileOutput || null,
            stderr: stderr || null,
            code: codeText || null
          });
        }
      } catch (e) {
        console.error('Failed to persist submission error after analysis:', e);
      }
    }

    return res.json({ ok: true, analysis: aiResult, logic: isLogicError });
  } catch (err: any) {
    console.error("/api/errors/analyze failed:", err);
    return res.status(500).json({ message: err?.message || "Unexpected error" });
  }
});

module.exports = router;
