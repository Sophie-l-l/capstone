const express = require("express");
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Get all problem sets for a class
router.get("/class/:classId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const userId = (req as any).user.userId;

    if (!classId) {
      return res.status(400).json({ message: "Class ID is required" });
    }

    // Verify access to class
    const classData = await prisma.class.findUnique({
      where: { id: classId as string },
      include: {
        enrollments: {
          where: { studentId: userId }
        }
      }
    });

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    const isInstructor = classData.instructorId === userId;
    const isEnrolled = classData.enrollments.length > 0;

    if (!isInstructor && !isEnrolled) {
      return res.status(403).json({ message: "Access denied" });
    }

    const problemSets = await prisma.problemSet.findMany({
      where: { classId: classId as string },
      include: {
        problems: {
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                difficulty: true,
                topics: true,
                knowledgeComponents: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(problemSets);
  } catch (error) {
    console.error("Get problem sets error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create new problem set (instructor only)
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (userRole !== "instructor") {
      return res.status(403).json({ message: "Only instructors can create problem sets" });
    }

    const { title, description, classId, problemIds, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // If classId provided, verify instructor owns the class
    if (classId) {
      const classData = await prisma.class.findUnique({
        where: { id: classId }
      });

      if (!classData || classData.instructorId !== userId) {
        return res.status(403).json({ message: "Access denied to this class" });
      }
    }

    // Create problem set with problems
    const problemSet = await prisma.problemSet.create({
      data: {
        title,
        description,
        classId: classId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        problems: {
          create: (problemIds || []).map((problemId: string, index: number) => ({
            problemId,
            order: index
          }))
        }
      },
      include: {
        problems: {
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                difficulty: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(problemSet);
  } catch (error) {
    console.error("Create problem set error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single problem set
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const problemSet = await prisma.problemSet.findUnique({
      where: { id: id as string },
      include: {
        class: {
          include: {
            enrollments: {
              where: { studentId: userId }
            }
          }
        },
        problems: {
          include: {
            problem: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!problemSet) {
      return res.status(404).json({ message: "Problem set not found" });
    }

    // Check authorization
    if (problemSet.class) {
      const isInstructor = problemSet.class.instructorId === userId;
      const isEnrolled = problemSet.class.enrollments.length > 0;

      if (!isInstructor && !isEnrolled) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.json(problemSet);
  } catch (error) {
    console.error("Get problem set error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add problem to problem set
router.post("/:id/problems", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { problemId } = req.body;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (userRole !== "instructor") {
      return res.status(403).json({ message: "Only instructors can modify problem sets" });
    }

    const problemSet = await prisma.problemSet.findUnique({
      where: { id: id as string },
      include: {
        class: true,
        problems: true
      }
    });

    if (!problemSet) {
      return res.status(404).json({ message: "Problem set not found" });
    }

    if (problemSet.class && problemSet.class.instructorId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get next order number
    const maxOrder = problemSet.problems.reduce((max: number, p: any) => Math.max(max, p.order), -1);

    const item = await prisma.problemSetItem.create({
      data: {
        problemSetId: id as string,
        problemId: problemId as string,
        order: maxOrder + 1
      },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true
          }
        }
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Add problem to set error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
