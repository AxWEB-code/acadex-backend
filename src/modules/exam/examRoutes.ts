import { Router } from "express";
import { protect } from "../../middleware/authMiddleware";
import {
  createExamHandler,
  getExamsHandler,
  getExamByIdHandler,
  approveExamHandler,
  updateExamStatusHandler,
  getExamByCodeHandler
} from "./examController";

const router = Router();

// All exam routes are protected
router.use(protect);

// Routes that use controller functions
router.get("/", getExamsHandler); // Get all exams
router.post("/", createExamHandler); // Create exam
router.get("/:id", getExamByIdHandler); // Get exam by ID
router.get("/code/:examCode", getExamByCodeHandler); // Get exam by code
router.patch("/:id/approve", approveExamHandler); // Approve exam
router.patch("/:id/status", updateExamStatusHandler); // Update exam status

// Optional: Keep your test route
router.get("/test", (req, res) => {
  res.json({ 
    success: true,
    message: "🎯 Exam routes are working!",
    timestamp: new Date().toISOString()
  });
});

export default router;