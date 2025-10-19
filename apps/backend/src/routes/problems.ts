const express = require("express");
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Get all problems with filtering and pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      difficulty,
      topic,
      search,
      page = "1",
      limit = "20",
      sortBy = "title"
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (topic) {
      where.topics = {
        has: topic
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Build order by clause
    const orderBy: any = {};
    switch (sortBy) {
      case "difficulty":
        orderBy.difficulty = "asc";
        break;
      case "acceptance_rate":
        orderBy.acceptanceRate = "desc";
        break;
      case "total_submissions":
        orderBy.totalSubmissions = "desc";
        break;
      default:
        orderBy.title = "asc";
    }

    // Get problems with count
    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        select: {
          id: true,
          title: true,
          difficulty: true,
          topics: true,
          knowledgeComponents: true,
          acceptanceRate: true,
          totalSubmissions: true
        }
      }),
      prisma.problem.count({ where })
    ]);

    res.json({
      problems,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("Get problems error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single problem by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Problem ID is required" });
    }

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        testCases: {
          where: { isHidden: false }, // Only return public test cases
          select: {
            id: true,
            input: true,
            output: true,
            explanation: true,
            isHidden: true,
            points: true
          }
        }
      }
    });

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Format response to match frontend expectations
    const { testCases, ...formattedProblem } = problem;
    const responseData = {
      ...formattedProblem,
      examples: testCases
    };

    res.json(responseData);
  } catch (error) {
    console.error("Get problem error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create new problem (instructor only)
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;

    if (userRole !== "instructor") {
      return res.status(403).json({ message: "Only instructors can create problems" });
    }

    const {
      title,
      difficulty,
      description,
      inputFormat,
      outputFormat,
      timeLimit,
      memoryLimit,
      topics,
      knowledgeComponents,
      constraints,
      testCases
    } = req.body;

    // Validate required fields
    if (!title || !difficulty || !description || !inputFormat || !outputFormat) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({ message: "At least one test case is required" });
    }

    // Create problem with test cases
    const problem = await prisma.problem.create({
      data: {
        title,
        difficulty,
        description,
        inputFormat,
        outputFormat,
        timeLimit: timeLimit || 5,
        memoryLimit: memoryLimit || 256,
        topics: topics || [],
        knowledgeComponents: knowledgeComponents || [],
        constraints: constraints || [],
        acceptanceRate: 0,
        totalSubmissions: 0,
        testCases: {
          create: testCases.map((tc: any) => ({
            input: tc.input,
            output: tc.output,
            explanation: tc.explanation || "",
            isHidden: tc.isHidden || false,
            points: tc.points || 10
          }))
        }
      },
      include: {
        testCases: true
      }
    });

    res.status(201).json(problem);
  } catch (error) {
    console.error("Create problem error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;