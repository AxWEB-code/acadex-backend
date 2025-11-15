import { Router } from "express";
import prisma from "../../../lib/prisma";

const router = Router();

// GET /api/superadmin/schools/:id/exams
router.get("/:id/exams", async (req, res) => {
  try {
    const schoolId = Number(req.params.id);

    if (isNaN(schoolId)) {
      return res.status(400).json({ error: "Invalid school id" });
    }

    // Only include RELATIONS that exist in your Exam model
    const exams = await prisma.exam.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      // include: { department: true } ❌ removed (not in your schema)
      // include: { createdBy: true } ❌ remove unless you confirm it exists
    });

    return res.json({ exams });

  } catch (error) {
    console.error("EXAMS API ERROR:", error);
    return res.status(500).json({ error: "Failed to fetch exams" });
  }
});

export default router;
