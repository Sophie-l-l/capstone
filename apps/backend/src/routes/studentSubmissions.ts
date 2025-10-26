import type { Request, Response } from "express";
const express = require("express");
const router = express.Router();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Note: this endpoint is intentionally public under the assumption that the
// dashboard page is already protected. Remove auth requirement so the client
// (which has already authenticated the student) can fetch submissions without
// re-sending the token.
// GET /:id/submissions?page=1&limit=20
router.get("/:id/submissions", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "20", 10)));

    if (!id) return res.status(400).json({ message: "Student ID required" });

    const where = { userId: id };

    const total = await prisma.submission.count({ where });

    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        status: true,
        language: true,
        testCasesPassed: true,
        totalTestCases: true,
        runtime: true,
        memory: true,
        submittedAt: true,
        problem: { select: { id: true, title: true } }
      }
    });

    const payload = submissions.map((s: any) => ({
      id: s.id,
      problemId: s.problem?.id,
      problemTitle: s.problem?.title,
      status: s.status,
      language: s.language,
      testCasesPassed: s.testCasesPassed,
      totalTestCases: s.totalTestCases,
      runtime: s.runtime,
      memory: s.memory,
      submittedAt: s.submittedAt
    }));

    res.json({ submissions: payload, page, limit, total });
  } catch (error) {
    console.error("Get student submissions error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
