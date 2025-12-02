import { Router } from "express";
import prisma from "../../../../../lib/prisma";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { id } = req.params as any;
    const schoolId = Number(id);

    if (!schoolId) {
      return res.status(400).json({ error: "Invalid school ID" });
    }

    const exams = await prisma.exam.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        examTitle: true,
        examCode: true,
        mode: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    });

    const formatted = exams.map((e) => ({
      id: e.id,
      code: e.examCode,
      title: e.examTitle,
      type: "N/A", // you don't have exam type in your model
      mode: e.mode,
      status: e.status,
      students: 0, // you can compute later
      start: e.startDate
        ? new Date(e.startDate).toISOString().split("T")[0]
        : "—",
      end: e.endDate
        ? new Date(e.endDate).toISOString().split("T")[0]
        : "—",
    }));

    return res.json({ exams: formatted });
  } catch (err) {
    console.error("EXAMS FETCH ERROR:", err);
    return res.status(500).json({ error: "Unable to load exams" });
  }
});

export default router;
