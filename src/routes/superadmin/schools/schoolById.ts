import { Router } from "express";
import prisma from "../../../lib/prisma";

const router = Router();

// GET /api/superadmin/schools/:id
router.get("/:id", async (req, res) => {
  try {
    const schoolId = Number(req.params.id);

    if (isNaN(schoolId)) {
      return res.status(400).json({ error: "Invalid school ID" });
    }

    // Only include relations that ACTUALLY exist on School
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        students: true,
        exams: true,
        // ❌ examResults removed — it does NOT exist on your School model
        // admins: true — also removed earlier because School has no admins relation
      },
    });

    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    return res.json({
      ...school,
      studentsCount: school.students.length,
      examsCount: school.exams.length,
      resultsCount: 0,   // placeholder until linked properly
      adminsCount: 0,    // placeholder
    });

  } catch (err) {
    console.error("Error fetching school:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
