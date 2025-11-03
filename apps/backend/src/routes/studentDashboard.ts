import type { Request, Response } from "express";
import express = require("express");
const router = express.Router();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Local types to tighten up implicit-any issues when working with selected fields
type SubmissionWithProblem = {
  id: string;
  status: string;
  language?: string | null;
  problem?: { topics?: (string | null)[] | null } | null;
};

type KCState = { kc: { name: string }; pKnown: number };

// GET /:id/dashboard
router.get("/:id/dashboard", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    // Fetch basic student info. First try id lookup; in dev the frontend sometimes
    // passes a username or numeric id (e.g. "1") so fall back to username lookup
    // for convenience in local development.
    let student = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true }
    });

    if (!student) {
      // Fallback: try lookup by username (helps when frontend uses a numeric or
      // short username during dev/mock auth flows).
      student = await prisma.user.findUnique({
        where: { username: id },
        select: { id: true, name: true, email: true }
      });
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Fetch submissions for this student (include problem topics, runtime, and timestamps)
    const submissions = await prisma.submission.findMany({
      where: { userId: id },
      select: {
        id: true,
        status: true,
        language: true,
        runtime: true,
        submittedAt: true,
        problem: { select: { topics: true } }
      },
      orderBy: { submittedAt: 'asc' }
    }) as unknown as (SubmissionWithProblem & { runtime?: number | null; submittedAt?: Date | null })[];

    const totalSubmissions = submissions.length;
    const acceptedCount = submissions.filter((s) => s.status === "accepted").length;
    const overallAccuracy = totalSubmissions > 0 ? acceptedCount / totalSubmissions : 0;

    // Accuracy by language
    const langTotals: Record<string, { total: number; accepted: number }> = {};
    // Accuracy by topic
    const topicTotals: Record<string, { total: number; accepted: number }> = {};
    // Error distribution by status
    const errorDist: Record<string, number> = {};

    for (const s of submissions) {
      // Language aggregation
      const lang = s.language || "unknown";
      if (!langTotals[lang]) langTotals[lang] = { total: 0, accepted: 0 };
      langTotals[lang].total += 1;
      if (s.status === "accepted") langTotals[lang].accepted += 1;

    // Topic aggregation (problem.topics may contain nulls from DB partial select)
    const rawTopics = s.problem?.topics || [];
    const topics = (rawTopics as (string | null)[]).filter((t): t is string => typeof t === "string");
      for (const t of topics) {
        if (!topicTotals[t]) topicTotals[t] = { total: 0, accepted: 0 };
        topicTotals[t].total += 1;
        if (s.status === "accepted") topicTotals[t].accepted += 1;
      }

      // Error distribution
      errorDist[s.status] = (errorDist[s.status] || 0) + 1;
    }

    // --- Time spent calculations ---
    // Active user time: estimate using submission timestamps. We sum the gaps between consecutive submissions
    // but cap any long idle gaps to MAX_GAP_SECONDS (so long breaks don't count).
    const MAX_GAP_SECONDS = 30 * 60 // 30 minutes
    const submissionTimes: number[] = submissions
      .map((s) => (s.submittedAt ? new Date(s.submittedAt).getTime() / 1000 : NaN))
      .filter((t) => !Number.isNaN(t))

    let activeTimeSeconds = 0
    if (submissionTimes.length === 1) {
      // Single submission: assume a small interaction window (default 60s)
      activeTimeSeconds = 60
    } else if (submissionTimes.length > 1) {
      for (let i = 1; i < submissionTimes.length; i++) {
        const curr = submissionTimes[i]!
        const prev = submissionTimes[i - 1]!
        const delta = curr - prev
        activeTimeSeconds += Math.min(delta, MAX_GAP_SECONDS)
      }
    }

    // Total time spent is currently estimated from active user time only.
    // We intentionally remove any compile-time heuristics so the metric reflects
    // the user's active problem-solving time based on submission activity.
    const totalTimeSpentSeconds = activeTimeSeconds

    const accuracyByLanguage = Object.entries(langTotals).map(([language, v]) => ({
      language,
      accuracy: v.total > 0 ? v.accepted / v.total : 0
    }));

    const accuracyByTopic = Object.entries(topicTotals).map(([topic, v]) => ({
      topic,
      accuracy: v.total > 0 ? v.accepted / v.total : 0
    }));

    const errorDistribution = Object.entries(errorDist).map(([status, count]) => ({ status, count }));

    // KC mastery: return canonical knowledge components merged with any existing BKT state.
    // This prevents the UI from showing topic-derived names that aren't canonical KCs.
  const allKCs: { id: string; name: string }[] = await prisma.knowledgeComponent.findMany({ select: { id: true, name: true } });

    const kcStates = await prisma.bKTState.findMany({
      where: { userId: id },
      include: { kc: { select: { name: true } } }
    }) as unknown as KCState[];

    // Map existing BKT states by kc name for quick lookup
    const stateMap: Record<string, number> = {};
    for (const s of kcStates) {
      if (s?.kc?.name) stateMap[s.kc.name] = s.pKnown;
    }

    // Build kcMastery from canonical KCs; default pKnown to 0 if missing
    const kcMastery = allKCs.map((kc) => ({ kc: kc.name, pKnown: stateMap[kc.name] ?? 0 }));

    // Build response
    const response = {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        totalSubmissions,
        accuracy: parseFloat(overallAccuracy.toFixed(4))
      },
      accuracyByLanguage,
      accuracyByTopic,
      errorDistribution,
      kcMastery,
      // time spent breakdown (seconds) — currently active user time only
      timeSpent: {
        totalSeconds: Math.round(totalTimeSpentSeconds),
        activeSeconds: Math.round(activeTimeSeconds)
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Get student dashboard error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
