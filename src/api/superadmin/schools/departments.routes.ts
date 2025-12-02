import { Router } from "express";
import prisma from "../../../lib/prisma";   // adjust path if needed

const router = Router();

// GET departments for a school
router.get("/:schoolId/departments", async (req, res) => {
  try {
    const schoolId = Number(req.params.schoolId);

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "Invalid school ID",
      });
    }

    const departments = await prisma.department.findMany({
      where: { schoolId },
      select: { id: true, name: true },
    });

    return res.json({
      success: true,
      departments,
    });
  } catch (err) {
    console.error("Department fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;
