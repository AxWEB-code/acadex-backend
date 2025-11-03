import { Router } from "express";
import { protect, isAdmin } from "../middleware/authMiddleware";
import {
  approveStudent,
  rejectStudent,
  getPendingStudents,
  getApprovedStudents,
} from "../controllers/approvalController";
import { forgotPassword, resetPassword } from "../controllers/authController";

const router = Router();

// 🧩 Approval actions
router.post("/students/:id/approve", protect, isAdmin, approveStudent);
router.post("/students/:id/reject", protect, isAdmin, rejectStudent);

// 🧩 Admin dashboard lists
router.get("/students/pending", protect, isAdmin, getPendingStudents);
router.get("/students/approved", protect, isAdmin, getApprovedStudents);

// 🧩 Forgot/Reset Password
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);

export default router;
