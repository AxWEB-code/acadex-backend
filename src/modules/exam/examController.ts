import { Request, Response } from "express";
import prisma from "../../prisma";
import {
  createExam,
  getExams,
  getExamById,
  approveExam,
  updateExamStatus,
  publishExam,
} from "./examService";


export const createExamHandler = async (req: Request, res: Response) => {
  try {
    const examData = {
      ...req.body,
      createdById: (req as any).user?.id || "system" // From auth middleware
    };
    
    const createdExam = await createExam(examData);
    
    res.status(201).json({
      success: true,
      message: "Exam created successfully",
      data: createdExam
    });
  } catch (error: any) {
    console.error("❌ Create exam error:", error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const getExamsHandler = async (req: Request, res: Response) => {
  try {
    const filters = {
      schoolId: req.query.schoolId as string,
      status: req.query.status as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10
    };

    const result = await getExams(filters);
    
    res.json({
      success: true,
      data: result.exams,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error("❌ Get exams error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getExamByIdHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const exam = await getExamById(id);
    
    res.json({
      success: true,
      data: exam
    });
  } catch (error: any) {
    console.error("❌ Get exam error:", error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

export const approveExamHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedExam = await approveExam(id);
    
    res.json({
      success: true,
      message: "Exam approved successfully",
      data: updatedExam
    });
  } catch (error: any) {
    console.error("❌ Approve exam error:", error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const updateExamStatusHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedExam = await updateExamStatus(id, status);
    
    res.json({
      success: true,
      message: `Exam status updated to ${status}`,
      data: updatedExam
    });
  } catch (error: any) {
    console.error("❌ Update exam status error:", error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const publishExamHandler = async (req: Request, res: Response) => {
  try {
    const { basic, papers, settings, notes } = req.body;

    const result = await publishExam(basic, papers, settings, notes);

    res.status(201).json({
      success: true,
      message: "Exam successfully published",
      data: result
    });

  } catch (error: any) {
    console.error("❌ Publish exam error:", error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};


export const getExamByCodeHandler = async (req: Request, res: Response) => {
  try {
    const { examCode } = req.params;

    const exam = await prisma.exam.findUnique({
      where: { examCode },
     include: {
  school: true,
  papers: {
    include: {
      objectiveQuestions: true,
      theoryQuestions: true,
      practicalItems: true,
    },
  },
  results: true,
  settings: true,
},


    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: "Exam not found"
      });
    }

    res.json({
      success: true,
      data: exam
    });
  } catch (error: any) {
    console.error("❌ Get exam by code error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
