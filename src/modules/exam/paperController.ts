import { Request, Response } from "express";
import { createExamPaper } from "./paperService";

export const createExamPaperHandler = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;

    const paper = await createExamPaper(examId, req.body);

    res.status(201).json({
      success: true,
      message: "Paper created successfully",
      data: paper,
    });
  } catch (error: any) {
    console.error("❌ Create paper error:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
