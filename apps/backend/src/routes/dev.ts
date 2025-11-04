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
