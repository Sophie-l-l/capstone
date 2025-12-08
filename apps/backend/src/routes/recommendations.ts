import type { Request, Response } from "express";
import express = require("express");
const router = express.Router();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /:userId/recommendations
// Returns personalized problem recommendations based on BKT mastery and submission history
router.get("/:userId/recommendations", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(20, Math.max(1, parseInt((req.query.limit as string) || "10", 10)));

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Get student's weakest knowledge components from BKT
    const bktStates = await prisma.bKTState.findMany({
      where: { userId },
      include: { kc: true },
      orderBy: { pKnown: 'asc' }, // Weakest first
      take: 5 // Focus on top 5 weakest areas
    });

    const weakKCs = bktStates.map(state => state.kc.name);

    // Get problems the student hasn't solved yet
    const solvedProblemIds = await prisma.submission.findMany({
      where: { 
        userId,
        status: 'accepted'
      },
      select: { problemId: true },
      distinct: ['problemId']
    }).then(results => results.map(r => r.problemId));

    // Get attempted but not solved problems (to retry)
    const attemptedProblemIds = await prisma.submission.findMany({
      where: { userId },
      select: { problemId: true },
      distinct: ['problemId']
    }).then(results => results.map(r => r.problemId));

    const retryProblemIds = attemptedProblemIds.filter(id => !solvedProblemIds.includes(id));

    // Find recommended problems:
    // 1. Problems matching weak KCs
    // 2. Not yet accepted
    // 3. Prioritize: retry problems first, then new problems
    // 4. Mix of easy/medium difficulty for weak areas
    
    const recommendations = await prisma.problem.findMany({
      where: {
        AND: [
          {
            OR: weakKCs.length > 0 ? weakKCs.map(kc => ({
              knowledgeComponents: { has: kc }
            })) : [{}]
          },
          {
            id: { notIn: solvedProblemIds }
          }
        ]
      },
      orderBy: [
        // Prioritize retry problems
        { id: retryProblemIds.length > 0 ? { in: retryProblemIds } as any : undefined },
        // Then by difficulty (easier first for weak areas)
        { difficulty: 'asc' }
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        difficulty: true,
        topics: true,
        knowledgeComponents: true,
        successRate: true
      }
    });

    // Add reasoning for each recommendation
    const recommendationsWithReason = recommendations.map(problem => {
      const matchingWeakKCs = problem.knowledgeComponents?.filter((kc: string) => weakKCs.includes(kc)) || [];
      const isRetry = retryProblemIds.includes(problem.id);
      
      let reason = '';
      if (isRetry) {
        reason = `Retry recommended: You've attempted this but haven't solved it yet.`;
      } else if (matchingWeakKCs.length > 0) {
        reason = `Focuses on your weak area${matchingWeakKCs.length > 1 ? 's' : ''}: ${matchingWeakKCs.join(', ')}`;
      } else {
        reason = 'New challenge to expand your skills';
      }

      return {
        ...problem,
        reason,
        isRetry,
        matchingWeakKCs
      };
    });

    res.json({
      recommendations: recommendationsWithReason,
      weakAreas: weakKCs,
      totalSolved: solvedProblemIds.length,
      totalAttempted: attemptedProblemIds.length
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
