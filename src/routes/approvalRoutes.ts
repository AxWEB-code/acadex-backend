import { Router } from "express";
import { protect, isAdmin } from "../middleware/authMiddleware";
import { approveStudent, rejectStudent } from "../controllers/approvalController";

const router = Router();

router.post("/students/:id/approve", protect, isAdmin, approveStudent);
router.post("/students/:id/reject", protect, isAdmin, rejectStudent);

export default router;
