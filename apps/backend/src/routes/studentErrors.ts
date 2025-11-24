import type { Request, Response } from "express";
import express = require("express");
const router = express.Router();
import { getStudentTopErrors, getStudentRecentErrors } from "../services/errorClassifier.service";

/**
 * GET /api/students/:id/errors
 * Get error analytics for a student
 */
router.get("/:id/errors", async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.params;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

    if (!userId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    // Get top error types and recent errors in parallel
    const [topErrors, recentErrors] = await Promise.all([
      getStudentTopErrors(userId, limit),
      getStudentRecentErrors(userId, 20)
    ]);

    res.json({
      topErrors,
      recentErrors: recentErrors.map((err: any) => {
        const sig = err.signature;
        
        return {
          id: err.id,
          // Full academic fields from database (new schema)
          surface_error: sig?.surfaceError || null,
          specific_error: sig?.specificError || null,
          compiler_excerpt: sig?.compilerExcerpt || null,
          cognitive_cause: sig?.cognitiveCause || null,
          bloom_level: sig?.bloomLevel || null,
          reasoning: sig?.reasoning || null,
          source: sig?.source || null,
          confidence: sig?.confidence || null,
          // Embedding data
          embedding: sig?.embedding || null,
          embeddingLength: Array.isArray(sig?.embedding) ? sig.embedding.length : 0,
          embeddingPreview: Array.isArray(sig?.embedding) ? sig.embedding.slice(0, 8) : null,
          // Submission context
          problemTitle: err.submission.problem?.title || "Unknown",
          problemId: err.submission.problemId,
          submissionId: err.submission.id,
          language: err.language,
          createdAt: err.createdAt,
          compileOutput: err.compileOutput,
          stderr: err.stderr
        };
      })
    });
  } catch (error: unknown) {
    console.error("Get student errors error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
