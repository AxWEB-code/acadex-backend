import { Router } from "express";
import prisma from "../../../lib/prisma";

const router = Router();

// GET /api/superadmin/schools/:id/results
router.get("/:id/results", async (req, res) => {
  try {
    const schoolId = Number(req.params.id);

    if (isNaN(schoolId)) {
      return res.status(400).json({ error: "Invalid school ID" });
    }

    const results = await prisma.examResult.findMany({
      where: {
        exam: {
          schoolId, // <-- CORRECT relation-based filtering
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        exam: true,
        student: true,
        course: true,
      },
    });

    const formatted = results.map((r) => ({
      id: r.id,
      score: r.score,
      status: r.status,
      createdAt: r.createdAt,

      exam: {
        id: r.exam.id,
        title: r.exam.examTitle,
        code: r.exam.examCode,
      },

      student: {
        id: r.student.id,
        name: r.student.firstName + " " + r.student.lastName,
        rollNumber: r.student.rollNumber,
      },

      course: {
        id: r.course.id,
        name: r.course.name,
        code: r.course.code,
      },
    }));

    return res.json({ results: formatted });
  } catch (error) {
    console.error("RESULT FETCH ERROR:", error);
    return res.status(500).json({ error: "Server error fetching results" });
  }
});

export default router;
