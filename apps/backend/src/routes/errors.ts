const express = require("express");
import type { Request, Response } from "express";
const { authenticateToken } = require("../middleware/auth");
const { classifyWithAI, recordSubmissionError } = require("../services/errorClassifier.service");

const router = express.Router();

// POST /api/errors/analyze
// Body: { code?: string, stderr?: string, compileOutput?: string, language?: string, persist?: boolean, submissionId?: string }
router.post("/analyze", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { code = "", stderr = "", compileOutput = "", language = null, persist = false, submissionId = null } = req.body || {};

    const outputText = (compileOutput || stderr || "").trim();
    const codeText = (code || "").trim();
    const combined = (codeText ? `Code:\n${codeText}\n\nError:\n${outputText}` : outputText).trim();

    if (!combined) {
      return res.status(400).json({ message: "code or error output is required" });
    }

    // Call AI classifier (this will attempt to generate an embedding too)
    const aiResult = await classifyWithAI(combined, language);

    // Optionally persist as a submission error if requested
    if (persist && submissionId) {
      try {
        await recordSubmissionError({ submissionId, language, compileOutput: compileOutput || null, stderr: stderr || null, code: code || null });
      } catch (e) {
        console.error('Failed to persist submission error after analysis:', e);
      }
    }

    return res.json({ ok: true, analysis: aiResult });
  } catch (err: any) {
    console.error("/api/errors/analyze failed:", err);
    return res.status(500).json({ message: err?.message || "Unexpected error" });
  }
});

module.exports = router;
