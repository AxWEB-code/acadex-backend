import { Router, Request, Response } from "express"; // Add Request and Response imports
import prisma from "../prisma";
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

const router = Router();

// CRUD
router.post("/", createStudent);
router.get("/", getStudents);
router.get("/:id", getStudent);
router.put("/:id", updateStudent);
router.patch("/:id", updateStudent);
router.delete("/:id", deleteStudent);

// Auth
router.post("/register", registerStudent);;
router.post("/login", loginStudent);

// Protected profile route
router.get("/profile/me", verifyToken, async (req: any, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.id },
      include: { school: true, department: true },
    });
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



export default router;