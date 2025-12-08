import type { Request, Response } from "express";
const express = require("express");
const router = express.Router();
import { PrismaClient } from "@prisma/client";
const { authenticateToken } = require("../middleware/auth");

const prisma = new PrismaClient();

// GET /api/submissions - Get submissions for the authenticated user
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { problemId, status, page = "1", limit = "100" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(1000, Math.max(1, parseInt(limit as string, 10)));

    // Build where clause
    const where: any = { userId };
    
    if (problemId) {
      where.problemId = problemId as string;
    }
    
    if (status) {
      where.status = status as string;
    }

    const total = await prisma.submission.count({ where });

    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      select: {
        id: true,
        problemId: true,
        status: true,
        language: true,
        testCasesPassed: true,
        totalTestCases: true,
        runtime: true,
        memory: true,
        submittedAt: true,
        problem: { 
          select: { 
            id: true, 
            title: true,
            difficulty: true 
          } 
        }
      }
    });

    const payload = submissions.map((s: any) => ({
      id: s.id,
      problemId: s.problemId,
      problemTitle: s.problem?.title,
      status: s.status,
      language: s.language,
      testCasesPassed: s.testCasesPassed,
      totalTestCases: s.totalTestCases,
      runtime: s.runtime,
      memory: s.memory,
      submittedAt: s.submittedAt
    }));

    res.json({ 
      submissions: payload, 
      page: pageNum, 
      limit: limitNum, 
      total 
    });
  } catch (error) {
    console.error("Get submissions error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
