import { Router } from "express";
import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  registerStudent,
  loginStudent,
} from "../controllers/studentController";
import { verifyToken } from "../middleware/authMiddleware";
import prisma from "../prisma";

const router = Router();

// 🧩 CRUD routes
router.post("/", createStudent);
router.get("/", getStudents);
router.get("/:id", getStudent);
router.put("/:id", updateStudent);
router.patch("/:id", updateStudent);
router.delete("/:id", deleteStudent);

// 🧩 Auth routes (final clean endpoints)
router.post("/register", registerStudent);  // ✅ frontend: /api/students/register
router.post("/login", loginStudent);        // ✅ frontend: /api/students/login

// 🧩 Protected route (profile)
router.get("/profile/me", verifyToken, async (req: any, res) => {
  try {
    if (!req.user?.id)
      return res.status(400).json({ error: "Missing user ID in token" });

    const student = await prisma.student.findUnique({
      where: { id: Number(req.user.id) },
      include: { school: true, department: true },
    });

    if (!student)
      return res.status(404).json({ error: "Student not found" });

    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
