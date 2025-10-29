import express from "express";
import {
  registerStudent,
  loginStudent,
  adminLogin,
  registerSchool,
} from "../controllers/authController";

const router = express.Router();

// ✅ Student auth
router.post("/student/register", registerStudent);
router.post("/student/login", loginStudent);

// ✅ School admin registration
router.post("/register", registerSchool); // 👈 now /api/auth/register works

// ✅ Admin login
router.post("/admin/login", adminLogin);

export default router;
