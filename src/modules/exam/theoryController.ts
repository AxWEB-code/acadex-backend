import { Request, Response } from "express";
import prisma from "../../prisma";

export const addTheoryQuestion = async (req: Request, res: Response) => {
  try {
    const { paperId } = req.params;
    const { text, marks } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Theory question text is required"
      });
    }

    const question = await prisma.theoryQuestion.create({
      data: {
        paperId,
        text,
        marks: marks || 5
      }
    });

    return res.json({ success: true, data: question });
  } catch (err: any) {
    console.error("❌ Add theory question error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};


export const addBulkTheoryQuestions = async (req: Request, res: Response) => {
  try {
    const { paperId } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Questions array is required"
      });
    }

    const formatted = questions.map((q: any) => ({
      paperId,
      text: q.text,
      marks: q.marks || 5
    }));

    const saved = await prisma.theoryQuestion.createMany({
      data: formatted
    });

    res.json({
      success: true,
      message: `Saved ${saved.count} theory questions`,
      count: saved.count
    });
  } catch (err: any) {
    console.error("❌ Bulk theory upload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
