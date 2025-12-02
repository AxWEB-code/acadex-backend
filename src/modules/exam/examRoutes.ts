import { Router } from "express";
import { protect } from "../../middleware/authMiddleware";
import {
  createExamHandler,
  getExamsHandler,
  getExamByIdHandler,
  approveExamHandler,
  updateExamStatusHandler,
  getExamByCodeHandler,
  publishExamHandler  
} from "./examController";
import { createExamPaperHandler } from "./paperController";
import { addTheoryQuestion, addBulkTheoryQuestions } from "./theoryController";
import { addPracticalItem, addBulkPracticalItems } from "./practicalController";



const router = Router();

// All exam routes are protected
router.use(protect);

// -------------------------------
// ORDER MATTERS!
// -------------------------------

// 👉 1. GET exam by code (more specific)
router.get("/code/:examCode", getExamByCodeHandler);

// 👉 2. GET all exams
router.get("/", getExamsHandler);

// 👉 3. Create exam
router.post("/", createExamHandler);

// 👉 4. Create exam paper
router.post("/:examId/papers", createExamPaperHandler);

// 👉 5. Approve exam
router.patch("/:id/approve", approveExamHandler);

// 👉 6. Update status
router.patch("/:id/status", updateExamStatusHandler);

// 👉 7. GET exam by ID (must ALWAYS be last)
router.get("/:id", getExamByIdHandler);

// THEORY
router.post("/:examId/papers/:paperId/theory", addTheoryQuestion);
router.post("/:examId/papers/:paperId/theory/bulk", addBulkTheoryQuestions);

// PRACTICAL CHECKLIST
router.post("/:examId/papers/:paperId/practical", addPracticalItem);
router.post("/:examId/papers/:paperId/practical/bulk", addBulkPracticalItems);

router.post("/publish", publishExamHandler);





// Optional test
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "🎯 Exam routes are working!",
    timestamp: new Date().toISOString(),
  });
});

export default router;
