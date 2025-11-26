import { Router } from "express";
import prisma from "../../../lib/prisma";

const router = Router();

// GET /api/superadmin/schools/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid school ID",
      });
    }

    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        students: true,
        exams: true,
        adminUsers: true,
        departments: true,
        accessKeys: true,
        subscriptions: true,
      },
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    return res.json({
      success: true,
      school: {
        id: school.id,
        name: school.name,
        schoolCode: school.schoolCode,
        subdomain: school.subdomain,
        schoolType: school.schoolType,
        plan: school.plan,
        status: school.status,
        logo: school.logo,
        createdAt: school.createdAt,

        students: school.students,
        exams: school.exams,
        admins: school.adminUsers,
        departments: school.departments,
        accessKeys: school.accessKeys,
        subscriptions: school.subscriptions,
      },
    });
  } catch (error) {
    console.error("GET SCHOOL ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching school",
    });
  }
});

export default router;
