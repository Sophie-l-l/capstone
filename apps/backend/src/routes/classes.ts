const express = require("express");
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Get all classes for current user (instructor's classes or student's enrolled classes)
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    let classes;

    if (userRole === "instructor") {
      // Get classes created by this instructor
      classes = await prisma.class.findMany({
        where: { instructorId: userId },
        include: {
          _count: {
            select: { enrollments: true, problemSets: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Get classes student is enrolled in
      classes = await prisma.class.findMany({
        where: {
          enrollments: {
            some: { studentId: userId }
          }
        },
        include: {
          instructor: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { enrollments: true, problemSets: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json(classes);
  } catch (error) {
    console.error("Get classes error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create new class (instructor only)
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (userRole !== "instructor") {
      return res.status(403).json({ message: "Only instructors can create classes" });
    }

    const { name, description, semester, code } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Class name is required" });
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        description,
        semester,
        code,
        instructorId: userId
      },
      include: {
        _count: {
          select: { enrollments: true, problemSets: true }
        }
      }
    });

    res.status(201).json(newClass);
  } catch (error) {
    console.error("Create class error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single class details
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        instructor: {
          select: { id: true, name: true, email: true }
        },
        enrollments: {
          include: {
            student: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        problemSets: {
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
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check authorization
    const isInstructor = classData.instructorId === userId;
    const isEnrolled = classData.enrollments.some(e => e.studentId === userId);

    if (!isInstructor && !isEnrolled) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(classData);
  } catch (error) {
    console.error("Get class error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Enroll student in class (using class code)
router.post("/:id/enroll", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (userRole !== "student") {
      return res.status(403).json({ message: "Only students can enroll in classes" });
    }

    const classData = await prisma.class.findUnique({
      where: { id }
    });

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check if already enrolled
    const existing = await prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: id,
          studentId: userId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ message: "Already enrolled in this class" });
    }

    const enrollment = await prisma.classEnrollment.create({
      data: {
        classId: id,
        studentId: userId
      }
    });

    res.status(201).json(enrollment);
  } catch (error) {
    console.error("Enroll error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
