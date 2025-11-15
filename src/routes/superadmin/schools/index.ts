import { Router, Request, Response } from "express";
import prisma from "../../../lib/prisma";

const router = Router();

// GET /api/superadmin/schools
router.get("/", async (req: Request, res: Response) => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        students: true, // ✅ this one exists
        // admins: true, // ❌ remove this, not defined on School model
      },
    });

    return res.json({
  success: true,
  schools: schools.map((s: any) => ({
    id: s.id,
    name: s.name,
    code: s.schoolCode,          // ✅ FIXED
    logo: s.logo ?? "/default-logo.png",
    status: s.status,
    createdAt: s.createdAt,
    studentsCount: s.students.length,
    adminsCount: 0,              // until we add admins route
    joined: s.createdAt,
  })),
});

  } catch (error) {
    console.error("Failed to load schools:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error loading schools" });
  }
});

export default router;
