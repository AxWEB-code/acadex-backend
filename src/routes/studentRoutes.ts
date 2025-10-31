import { Router } from "express";
import {
  registerStudent,
  loginStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController";

const router = Router();

// ✅ Registration and Login
router.post("/students/register", registerStudent);
router.post("/auth/student/login", loginStudent);

// ✅ Basic CRUD (for admin or debug)
router.get("/students", getStudents);
router.get("/students/:id", getStudent);
router.put("/students/:id", updateStudent);
router.delete("/students/:id", deleteStudent);

export default router;
