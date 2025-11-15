import { Router } from "express";
import prisma from "../../../lib/prisma"; // keep this if it's working for you

const router = Router();

// GET /api/superadmin/schools
router.get("/", async (req, res) => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        // We only include relations that actually exist on School
        students: true,
      },
    });

    return res.json({
      success: true,
      schools: schools.map((s: any) => ({
        id: s.id,
        name: s.name,
        code: s.schoolCode,              // ⬅️ you told me it's `schoolCode`
        logo: s.logo,
        status: s.status ?? "Active",
        createdAt: s.createdAt,
        studentsCount: s.students?.length ?? 0,
        adminsCount: 0,                  // ⬅️ placeholder until we have real relation
        joined: s.createdAt,
      })),
    });
  } catch (error) {
    console.error("Failed to load schools:", error);
    return res.status(500).json({
      success: false,
      message: "Server error loading schools",
    });
  }
});

export default router;
