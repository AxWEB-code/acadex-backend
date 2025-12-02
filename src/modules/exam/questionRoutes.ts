import { Router } from "express";
import {
  addQuestionHandler,
  getExamQuestionsHandler,
  bulkUploadQuestionsHandler
} from "./questionController.old";
import { protect } from "../../middleware/authMiddleware";

const router = Router();

router.use(protect);

// Question management routes
router.post("/:examId/questions", addQuestionHandler);
router.post("/:examId/questions/bulk", bulkUploadQuestionsHandler);
router.get("/:examId/questions", getExamQuestionsHandler);

export default router;