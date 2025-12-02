import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createExam(req: Request, res: Response) {
  try {
    const { basic, papers, settings, notes } = req.body;

    // Create exam
    const exam = await prisma.exam.create({
      data: {
        title: basic.title,
        code: basic.code,
        schoolId: Number(basic.schoolId),
        departmentId: Number(basic.departmentId),
        level: basic.level,
        semester: basic.semester,
        mode: basic.mode,
        startDate: new Date(basic.startDate),
        endDate: new Date(basic.endDate),
        durationMinutes: Number(basic.durationMinutes || 0),

        notes,

        settings: {
          allowBackNavigation: settings.allowBackNavigation,
          allowReviewBeforeSubmit: settings.allowReviewBeforeSubmit,
          showScoreAfterExam: settings.showScoreAfterExam,
          autoSubmitOnTimeout: settings.autoSubmitOnTimeout,
          offlineAllowed: settings.offlineAllowed,
          attemptLimit: Number(settings.attemptLimit || 1),
        },
      },
    });

    // Create papers + questions
    for (const p of papers) {
      const paper = await prisma.examPaper.create({
        data: {
          examId: exam.id,
          name: p.name,
          type: p.type,
          durationMinutes: Number(p.durationMinutes || 0),
          totalQuestions: Number(p.totalQuestions || 0),
          totalMarks: Number(p.totalMarks || 0),
          shuffleQuestions: p.shuffleQuestions,
          shuffleOptions: p.shuffleOptions,
          negativeMarking: p.negativeMarking,
          practicalChecklistFileName: p.practicalChecklistFileName || null,
        },
      });

      // OBJECTIVE
      if (p.objectiveQuestions) {
        for (const q of p.objectiveQuestions) {
          await prisma.examObjectiveQuestion.create({
            data: {
              paperId: paper.id,
              text: q.text,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              optionE: q.optionE,
              correct: q.correct,
              marks: Number(q.marks || 0),
            },
          });
        }
      }

      // THEORY
      if (p.theoryQuestions) {
        for (const q of p.theoryQuestions) {
          await prisma.examTheoryQuestion.create({
            data: {
              paperId: paper.id,
              text: q.text,
              marks: Number(q.marks || 0),
            },
          });
        }
      }

      // PRACTICAL OBJ
      if (p.practicalObjQuestions) {
        for (const q of p.practicalObjQuestions) {
          await prisma.examPracticalObjQuestion.create({
            data: {
              paperId: paper.id,
              text: q.text,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              optionE: q.optionE,
              correct: q.correct,
              marks: Number(q.marks || 0),
            },
          });
        }
      }
    }

    res.json({ success: true, examId: exam.id });

  } catch (err: any) {
    console.error("Create exam error:", err);
    res.status(500).json({ error: err.message });
  }
}
