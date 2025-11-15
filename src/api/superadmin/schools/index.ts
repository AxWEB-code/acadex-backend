import { Router } from "express";
import prisma from "../../lib/prisma";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        students: true,
        admins: true,
      },
    });

    return res.json({
      success: true,
      schools: schools.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        logo: s.logo,
        status: s.status,
        createdAt: s.createdAt,
        studentsCount: s.students.length,
        adminsCount: s.admins.length,
        joined: s.createdAt,
      })),
    });
  } catch (err) {
    console.error("LOAD SCHOOLS ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
