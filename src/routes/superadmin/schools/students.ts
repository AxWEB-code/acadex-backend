import { Router } from "express";
import prisma from "../../../lib/prisma";

const router = Router();

router.get("/:id/students", async (req, res) => {
  try {
    const schoolId = Number(req.params.id);
    if (isNaN(schoolId)) return res.status(400).json({ error: "Invalid school ID" });

    const students = await prisma.student.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rollNumber: true,
        admissionNo: true,
        firstName: true,
        lastName: true,
        class: true,
        department: { select: { name: true } },
        gender: true,
        email: true,
        contactNumber: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    const formatted = students.map((s: any) => ({
      id: s.id,
      name: s.firstName + " " + s.lastName,
      rollNo: s.rollNumber,
      admissionNo: s.admissionNo,
      class: s.class ?? "—",
      department: s.department?.name ?? "—",
      gender: s.gender ?? "—",
      email: s.email,
      phone: s.contactNumber ?? "—",
      status: s.isActive ? "Active" : "Inactive",
      lastLogin: s.lastLogin ?? "—",
    }));

    res.json({ students: formatted });
  } catch (err) {
    console.error("STUDENTS ERROR:", err);
    res.status(500).json({ error: "Unable to fetch students" });
  }
});

export default router;
