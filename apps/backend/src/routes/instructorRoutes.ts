import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const { authenticateToken } = require('../middleware/auth');

const router = Router();
const prisma = new PrismaClient();

// Middleware to check if user is an instructor
const requireInstructor = (req: any, res: any, next: any) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Access denied. Instructor role required.' });
  }
  next();
};

// GET /api/instructor/classes - List all classes for the instructor
router.get('/classes', authenticateToken, requireInstructor, async (req: any, res) => {
  try {
    const classes = await prisma.class.findMany({
      where: { instructorId: req.user.userId },
      include: {
        _count: {
          select: {
            enrollments: true,
            problemSets: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// POST /api/instructor/classes - Create a new class
router.post('/classes', authenticateToken, requireInstructor, async (req: any, res) => {
  try {
    const { name, description, semester, code } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Class name is required' });
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        description,
        semester,
        code,
        instructorId: req.user.userId
      }
    });

    res.status(201).json(newClass);
  } catch (error: any) {
    console.error('Error creating class:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Class code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create class' });
    }
  }
});

// GET /api/instructor/classes/:id - Get class details
router.get('/classes/:id', authenticateToken, requireInstructor, async (req: any, res) => {
  try {
    const { id } = req.params;

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true
              }
            }
          }
        },
        problemSets: {
          include: {
            _count: {
              select: { problems: true }
            }
          }
        }
      }
    });

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Verify instructor owns this class
    if (classData.instructorId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(classData);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Failed to fetch class details' });
  }
});

// POST /api/instructor/classes/:id/enroll - Add student to class
router.post('/classes/:id/enroll', authenticateToken, requireInstructor, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { studentEmail } = req.body;

    // Verify class belongs to instructor
    const classData = await prisma.class.findUnique({ where: { id } });
    if (!classData || classData.instructorId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find student by email
    const student = await prisma.user.findUnique({
      where: { email: studentEmail }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ error: 'User is not a student' });
    }

    // Enroll student
    const enrollment = await prisma.classEnrollment.create({
      data: {
        classId: id,
        studentId: student.id
      }
    });

    res.status(201).json(enrollment);
  } catch (error: any) {
    console.error('Error enrolling student:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Student already enrolled' });
    } else {
      res.status(500).json({ error: 'Failed to enroll student' });
    }
  }
});

// GET /api/instructor/classes/:id/analytics - Get class analytics
router.get('/classes/:id/analytics', authenticateToken, requireInstructor, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Verify class belongs to instructor
    const classData = await prisma.class.findUnique({ 
      where: { id },
      include: {
        enrollments: {
          include: {
            student: true
          }
        }
      }
    });

    if (!classData || classData.instructorId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const studentIds = classData.enrollments.map(e => e.studentId);

    // Get submission stats for all students in class
    const submissions = await prisma.submission.findMany({
      where: { userId: { in: studentIds } },
      select: {
        userId: true,
        status: true,
        submittedAt: true
      }
    });

    // Get BKT states for all students
    const bktStates = await prisma.bKTState.findMany({
      where: { userId: { in: studentIds } },
      include: {
        kc: { select: { name: true } },
        user: { select: { name: true, email: true } }
      }
    });

    // Aggregate stats
    const studentStats = studentIds.map(studentId => {
      const studentSubs = submissions.filter(s => s.userId === studentId);
      const accepted = studentSubs.filter(s => s.status === 'accepted').length;
      const total = studentSubs.length;
      const studentBKT = bktStates.filter(b => b.userId === studentId);
      const avgMastery = studentBKT.length > 0
        ? studentBKT.reduce((sum, b) => sum + b.pKnown, 0) / studentBKT.length
        : 0;

      const student = classData.enrollments.find(e => e.studentId === studentId)?.student;

      return {
        studentId,
        name: student?.name,
        email: student?.email,
        totalSubmissions: total,
        acceptedSubmissions: accepted,
        acceptanceRate: total > 0 ? accepted / total : 0,
        avgMastery,
        isAtRisk: avgMastery < 0.4 && total > 5
      };
    });

    // KC mastery distribution
    const kcMastery = bktStates.reduce((acc: any, state) => {
      const kcName = state.kc.name;
      if (!acc[kcName]) {
        acc[kcName] = { total: 0, sum: 0, count: 0 };
      }
      acc[kcName].sum += state.pKnown;
      acc[kcName].count += 1;
      return acc;
    }, {});

    const kcStats = Object.entries(kcMastery).map(([kc, data]: [string, any]) => ({
      kc,
      avgMastery: data.count > 0 ? data.sum / data.count : 0,
      studentCount: data.count
    }));

    res.json({
      studentStats,
      kcStats,
      summary: {
        totalStudents: studentIds.length,
        totalSubmissions: submissions.length,
        atRiskStudents: studentStats.filter(s => s.isAtRisk).length
      }
    });
  } catch (error) {
    console.error('Error fetching class analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/instructor/students - List all students (for enrollment)
router.get('/students', authenticateToken, requireInstructor, async (req: any, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        name: true,
        email: true,
        username: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// POST /api/instructor/admin/sync-knowledge-components
// Admin endpoint to flush and sync KnowledgeComponent table from all problems
// WARNING: This will delete all BKT states and recreate them on next submissions
router.post('/admin/sync-knowledge-components', async (req: Request, res: Response) => {
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

    res.json({
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
  } catch (error: any) {
    console.error('Error syncing knowledge components:', error);
    res.status(500).json({ error: 'Failed to sync knowledge components', message: error?.message });
  }
});

export default router;

