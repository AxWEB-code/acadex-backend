import { Request, Response } from "express";
import prisma from "../../prisma";

export const addQuestionHandler = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const {
      courseId,
      questionType,
      questionText,
      questionFile,
      correctAnswer,
      marks
    } = req.body;

    // Verify exam exists
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: "Exam not found"
      });
    }

    const question = await prisma.examQuestion.create({
      data: {
        examId,
        courseId,
        questionType,
        questionText,
        questionFile,
        correctAnswer,
        marks: marks || 1
      },
      include: {
        exam: true,
        course: true
      }
    });

    res.status(201).json({
      success: true,
      message: "Question added successfully",
      data: question
    });
  } catch (error: any) {
    console.error("❌ Add question error:", error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const getExamQuestionsHandler = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;

    const questions = await prisma.examQuestion.findMany({
      where: { examId },
      include: {
        course: true
      },
      orderBy: { createdAt: "asc" }
    });

    res.json({
      success: true,
      data: questions
    });
  } catch (error: any) {
    console.error("❌ Get questions error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const bulkUploadQuestionsHandler = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Questions array is required"
      });
    }

    // Verify exam exists
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: "Exam not found"
      });
    }

    const createdQuestions = await prisma.examQuestion.createMany({
      data: questions.map((q: any) => ({
        examId,
        courseId: q.courseId,
        questionType: q.questionType,
        questionText: q.questionText,
        questionFile: q.questionFile,
        correctAnswer: q.correctAnswer,
        marks: q.marks || 1
      }))
    });

    res.status(201).json({
      success: true,
      message: `${createdQuestions.count} questions uploaded successfully`,
      data: createdQuestions
    });
  } catch (error: any) {
    console.error("❌ Bulk upload questions error:", error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};