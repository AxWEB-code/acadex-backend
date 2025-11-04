import { Router } from "express";
import {
  registerStudent,
  loginStudent,
  adminLogin,
  registerSchool,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";

const router = Router();

// 🧑‍🎓 Student routes
router.post("/students/register", registerStudent);
router.post("/students/login", loginStudent);

// 🏫 School admin routes
router.post("/admin/register", registerSchool);
router.post("/admin/login", adminLogin);

// 🔐 Password management
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
