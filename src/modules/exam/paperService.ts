import prisma from "../../prisma";
import { ExamType } from "@prisma/client";

export const createExamPaper = async (examId: string, data: any) => {

  const {
    name,
    type,             // OBJECTIVE | THEORY | PRACTICAL
    duration,
    totalMarks,
    totalQuestions,
    shuffleQuestions,
    shuffleOptions,
    negativeMarking,
  } = data;

  // Validate type
  if (!Object.values(ExamType).includes(type)) {
    throw new Error("Invalid paper type");
  }

  const paper = await prisma.examPaper.create({
    data: {
      examId,
      name,
      type,
      duration,
      totalMarks,
      totalQuestions,
      shuffleQuestions: Boolean(shuffleQuestions),
      shuffleOptions: Boolean(shuffleOptions),
      negativeMarking: Boolean(negativeMarking),
    },
  });

  return paper;
};
