import { Router } from "express";
import prisma from "../../../lib/prisma";

const router = Router();

// GET /api/superadmin/schools/:id/admins
router.get("/:id/admins", async (req, res) => {
  try {
    const schoolId = Number(req.params.id);

    if (isNaN(schoolId)) {
      return res.status(400).json({ error: "Invalid school ID" });
    }

    const admins = await prisma.adminUser.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    const formatted = admins.map((a) => ({
      id: a.id,
      name: `${a.firstName} ${a.lastName}`,
      email: a.email,
      role: a.role,
      status: a.status,
      createdAt: a.createdAt,
    }));

    return res.json({ admins: formatted });
  } catch (error) {
    console.error("ADMIN FETCH ERROR:", error);
    return res.status(500).json({ error: "Server error fetching admins" });
  }
});

export default router;
