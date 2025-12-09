const Express = require("express");
const router = Express.Router();

const { recordSubmissionError } = require("../services/errorClassifier.service");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Dev-only endpoint to persist an error signature and submission error without Judge0
// POST /api/dev/save-error
// { submissionId: string, language: string, compileOutput?: string, stderr?: string }
router.post("/save-error", async (req: any, res: any) => {
  try {
    const { submissionId, language, compileOutput, stderr, code } = req.body || {};
    if (!submissionId || !language) {
      return res.status(400).json({ message: "submissionId and language are required" });
    }

    await recordSubmissionError({ submissionId, language, compileOutput, stderr, code });
    return res.status(201).json({ ok: true });
  } catch (err: any) {
    console.error("/api/dev/save-error failed:", err);
    return res.status(500).json({ message: err?.message || "Unexpected error" });
  }
});

module.exports = router;
 
// Helper to create a minimal submission for testing
// POST /api/dev/create-submission
// { userId, problemId, code, language, status }
router.post("/create-submission", async (req: any, res: any) => {
  try {
    let { userId, problemId, code = "", language = "python", status = "compilation_error" } = req.body || {};

    // Ensure a user exists
    if (!userId) {
      const user = await prisma.user.create({
        data: {
          username: `dev_user_${Date.now()}`,
          email: `dev_${Date.now()}@example.com`,
          name: "Dev User",
          passwordHash: "dev",
          role: "student",
        },
        select: { id: true }
      });
      userId = user.id;
    } else {
      const existingUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: userId,
            username: `dev_${userId.substring(0, 6)}`,
            email: `dev_${userId.substring(0, 6)}@example.com`,
            name: "Dev User",
            passwordHash: "dev",
            role: "student",
          }
        });
      }
    }

    // Ensure a problem exists
    if (!problemId) {
      const problem = await prisma.problem.create({
        data: {
          title: "Dev Problem",
          difficulty: "easy",
          description: "Dummy problem for testing error signature saving.",
          inputFormat: "",
          outputFormat: "",
          constraints: [],
          topics: [],
          knowledgeComponents: [],
        },
        select: { id: true }
      });
      problemId = problem.id;
    } else {
      const existingProblem = await prisma.problem.findUnique({ where: { id: problemId }, select: { id: true } });
      if (!existingProblem) {
        await prisma.problem.create({
          data: {
            id: problemId,
            title: `Dev Problem ${problemId.substring(0,6)}`,
            difficulty: "easy",
            description: "Dummy problem for testing error signature saving.",
            inputFormat: "",
            outputFormat: "",
            constraints: [],
            topics: [],
            knowledgeComponents: [],
          }
        });
      }
    }

    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        code,
        language,
        status,
        testCasesPassed: 0,
        totalTestCases: 0,
      },
      select: { id: true }
    });

    return res.status(201).json({ submissionId: submission.id, userId, problemId });
  } catch (err: any) {
    console.error("/api/dev/create-submission failed:", err);
    return res.status(500).json({ message: err?.message || "Unexpected error" });
  }
});

// GET /api/dev/check-bkt-states
// Returns all BKT states and Knowledge Components for debugging
router.get("/check-bkt-states", async (req: any, res: any) => {
  try {
    const kcs = await prisma.knowledgeComponent.findMany({
      select: { id: true, name: true }
    });
    
    const bktStates = await prisma.bKTState.findMany({
      include: {
        kc: { select: { name: true } },
        user: { select: { name: true, email: true } }
      }
    });
    
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    
    const problems = await prisma.problem.findMany({
      select: { id: true, title: true, knowledgeComponents: true }
    });
    
    return res.json({
      summary: {
        totalKCs: kcs.length,
        totalBKTStates: bktStates.length,
        totalUsers: users.length,
        totalProblems: problems.length
      },
      knowledgeComponents: kcs,
      bktStates: bktStates.map((b: any) => ({
        userId: b.userId,
        userName: b.user.name,
        kc: b.kc.name,
        pKnown: b.pKnown,
        pKnownPercent: `${(b.pKnown * 100).toFixed(1)}%`
      })),
      users: users,
      problemKCs: problems.map((p: any) => ({
        title: p.title,
        kcs: p.knowledgeComponents
      }))
    });
  } catch (err: any) {
    console.error("/api/dev/check-bkt-states failed:", err);
    return res.status(500).json({ message: err?.message || "Unexpected error" });
  }
});

// GET /api/dev/check-submissions - Check recent submissions and BKT updates
router.get("/check-submissions", async (_req: any, res: any) => {
  try {
    // Get recent submissions with problem KCs
    const submissions = await prisma.submission.findMany({
      include: {
        user: { select: { name: true, email: true } },
        problem: { select: { title: true, knowledgeComponents: true } }
      },
      orderBy: { submittedAt: 'desc' },
      take: 20
    });

    // Get all BKT states
    const bktStates = await prisma.bKTState.findMany({
      include: {
        user: { select: { name: true } },
        kc: { select: { name: true } }
      },
      orderBy: { lastUpdated: 'desc' }
    });

    // Get all KCs
    const allKCs = await prisma.knowledgeComponent.findMany();

    return res.json({
      summary: {
        totalSubmissions: submissions.length,
        totalBKTStates: bktStates.length,
        totalKCs: allKCs.length
      },
      recentSubmissions: submissions.map((s: any) => ({
        user: s.user.name,
        problem: s.problem.title,
        status: s.status,
        problemKCs: s.problem.knowledgeComponents,
        submittedAt: s.submittedAt
      })),
      bktStates: bktStates.map((b: any) => ({
        user: b.user.name,
        kc: b.kc.name,
        pKnown: `${(b.pKnown * 100).toFixed(1)}%`,
        attempts: b.attempts,
        corrects: b.corrects,
        lastUpdated: b.lastUpdated
      })),
      allKCs: allKCs.map((kc: any) => kc.name)
    });
  } catch (err: any) {
    console.error("/api/dev/check-submissions failed:", err);
    return res.status(500).json({ message: err?.message || "Unexpected error" });
  }
});

// POST /api/dev/flush-and-sync-kcs
// Flushes KnowledgeComponent table and repopulates from all problems
router.post("/flush-and-sync-kcs", async (req: any, res: any) => {
  try {
    // Step 1: Get all unique KCs from problems
    const problems = await prisma.problem.findMany({
      select: { id: true, title: true, knowledgeComponents: true }
    });

    // Collect all unique KCs
    const allKCs = new Set<string>();
    problems.forEach((p: { knowledgeComponents: string[] }) => {
      p.knowledgeComponents.forEach((kc: string) => {
        if (kc && kc.trim()) {
          allKCs.add(kc.trim());
        }
      });
    });

    // Step 2: Check current KnowledgeComponent table
    const existingKCs = await prisma.knowledgeComponent.findMany();
    
    // Step 3: Delete all BKTState records first (foreign key constraint)
    const bktCount = await prisma.bKTState.count();
    if (bktCount > 0) {
      await prisma.bKTState.deleteMany({});
    }

    // Step 4: Delete all existing KCs
    const deleteResult = await prisma.knowledgeComponent.deleteMany({});

    // Step 5: Insert all KCs from problems
    const created: string[] = [];
    for (const kcName of Array.from(allKCs).sort()) {
      await prisma.knowledgeComponent.create({
        data: {
          name: kcName,
          description: `Knowledge component: ${kcName}`
        }
      });
      created.push(kcName);
    }

    // Step 6: Verify the sync
    const finalKCs = await prisma.knowledgeComponent.findMany({
      orderBy: { name: 'asc' }
    });

    return res.json({
      message: "✅ KnowledgeComponent table flushed and synced successfully",
      stats: {
        totalProblems: problems.length,
        uniqueKCsInProblems: allKCs.size,
        previousKCsInDB: existingKCs.length,
        currentKCsInDB: finalKCs.length,
        bktStatesCleared: bktCount,
        created: created
      },
      knowledgeComponents: finalKCs.map((kc: { name: string }) => kc.name),
      note: "BKT states will be automatically recreated when students submit solutions"
    });
  } catch (err: any) {
    console.error("/api/dev/flush-and-sync-kcs failed:", err);
    return res.status(500).json({ message: err?.message || "Unexpected error" });
  }
});


