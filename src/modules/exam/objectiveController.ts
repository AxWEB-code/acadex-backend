import { Request, Response } from "express";
import prisma from "../../prisma";

export const addObjectiveQuestion = async (req: Request, res: Response) => {
  try {
    const { paperId } = req.params;
    const { text, optionA, optionB, optionC, optionD, optionE, correct, marks } = req.body;

    if (!text || !optionA || !optionB || !optionC || !optionD) {
      return res.status(400).json({
        success: false,
        error: "Question text and at least options A–D are required",
      });
    }

    const question = await prisma.objectiveQuestion.create({
      data: {
        paperId,
        text,
        optionA,
        optionB,
        optionC,
        optionD,
        optionE: optionE || null,
        correct: correct || null,
        marks: marks || 1,
      },
    });

    res.json({ success: true, data: question });
  } catch (err: any) {
    console.error("❌ Add objective question error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const addBulkObjectiveQuestions = async (req: Request, res: Response) => {
  try {
    const { paperId } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Questions array is required",
      });
    }

    const formatted = questions.map((q: any) => ({
      paperId,
      text: q.text,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      optionE: q.optionE || null,
      correct: q.correct || null,
      marks: q.marks || 1,
    }));

    const saved = await prisma.objectiveQuestion.createMany({
      data: formatted,
    });

    res.json({
      success: true,
      message: `Saved ${saved.count} questions`,
      count: saved.count,
    });
  } catch (err: any) {
    console.error("❌ Bulk upload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
