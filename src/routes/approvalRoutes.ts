import { Router } from "express";
import { protect, isAdmin } from "../middleware/authMiddleware";
import {
  approveStudent,
  rejectStudent,
  getPendingStudents,
  getApprovedStudents,
} from "../controllers/approvalController";

const router = Router();

router.post("/students/:id/approve", protect, isAdmin, approveStudent);
router.post("/students/:id/reject", protect, isAdmin, rejectStudent);

router.get("/students/pending", protect, isAdmin, getPendingStudents);
router.get("/students/approved", protect, isAdmin, getApprovedStudents);

export default router;
