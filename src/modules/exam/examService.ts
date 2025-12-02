import prisma from "../../prisma";
import { ExamStatus } from "@prisma/client";
import { generateExamCode, validateExamData } from "./examUtils";

/**
 * ✅ Create a new exam (handles normal + resit exams)
 */
export const createExam = async (data: any) => {
  const errors = validateExamData(data);
  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }

  const {
    examTitle,
    mode,
    examTypes,
    departmentId,
    levelId,
    classId,
    sessionYear,
    startDate,
    endDate,
    duration,
    isResit,
    linkedExamCode,
    createdById,
    schoolId,
  } = data;

  const examCode = generateExamCode(isResit);
  const baseData: any = {
    examTitle,
    examCode,
    mode,
    examTypes,
    departmentId,
    levelId,
    classId,
    sessionYear,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    duration,
    isResit: Boolean(isResit),
    createdById,
    schoolId: Number(schoolId),
  };

  // ✅ Resit logic (still allowed)
  if (isResit && linkedExamCode) {
    const linkedExam = await prisma.exam.findUnique({
      where: { examCode: linkedExamCode },
      include: { results: true },
    });

    if (!linkedExam) throw new Error("Linked exam not found");

    const failedCourses = linkedExam.results
      .filter((result: any) => (result.score || 0) < 50)
      .map((result: any) => result.courseId);

    baseData.linkedExamId = linkedExam.id;
    baseData.examTitle = `${linkedExam.examTitle} (Resit)`;
    // you can store failedCourses later in another table if needed
  }

  const newExam = await prisma.exam.create({
    data: baseData,
    include: {
      school: true,
      results: true,
      papers: true,
      settings: true,
    },
  });

  return newExam;
};

/**
 * ✅ Get paginated exams with filters
 */
export const getExams = async (filters: any = {}) => {
  const { schoolId, status, page = 1, limit = 10 } = filters;

  const where: any = {};
  if (schoolId) where.schoolId = Number(schoolId);
  if (status) where.status = status as ExamStatus;

  const exams = await prisma.exam.findMany({
    where,
    include: {
      school: true,
      results: true,
      papers: true,
      _count: {
        select: {
          results: true,
          papers: true,
        },
      },
    },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.exam.count({ where });

  return {
    exams,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
};

/**
 * ✅ Get single exam with all relationships
 */
export const getExamById = async (id: string) => {
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      school: true,
      papers: {
        include: {
          objectiveQuestions: true,
          theoryQuestions: true,
          practicalItems: true,
        },
      },
      results: {
        include: {
          student: true,
          course: true,
        },
      },
      notifications: true,
      settings: true,
    },
  });

  if (!exam) throw new Error("Exam not found");
  return exam;
};




/**
 * ✅ Approve an exam
 */
export const approveExam = async (id: string) => {
  const exam = await prisma.exam.findUnique({ where: { id } });
  if (!exam) throw new Error("Exam not found");

  const updatedExam = await prisma.exam.update({
    where: { id },
    data: { status: ExamStatus.APPROVED },
  });

  await prisma.examNotification.create({
    data: {
      examId: id,
      message: `Exam "${exam.examTitle}" has been approved and is now live.`,
    },
  });

  return updatedExam;
};

/**
 * ✅ Update exam status (enum-safe)
 */
export const updateExamStatus = async (id: string, status: string) => {
  const validStatuses: ExamStatus[] = [
    ExamStatus.PENDING,
    ExamStatus.APPROVED,
    ExamStatus.LIVE,
    ExamStatus.CLOSED,
  ];

  if (!validStatuses.includes(status as ExamStatus)) {
    throw new Error("Invalid status");
  }

  const exam = await prisma.exam.update({
    where: { id },
    data: { status: status as ExamStatus },
  });

  return exam;
};

export const publishExam = async (basic: any, papers: any[], settings: any, notes: string) => {
  // This function will handle the complete exam creation with papers & settings

  // 1) Create exam (basic info)
  const exam = await prisma.exam.create({
    data: {
      examTitle: basic.title,
      examCode: basic.code,
      mode: basic.mode,
      examTypes: [], // TODO: fill based on papers
      departmentId: basic.departmentId,
      sessionYear: basic.startDate.split("-")[0],
      startDate: new Date(basic.startDate),
      endDate: new Date(basic.endDate),
      duration: Number(basic.durationMinutes) || 0,
      schoolId: Number(basic.schoolId),
      createdById: "superadmin",
    },
  });

  // 2) Create papers
  for (const p of papers) {
    const paper = await prisma.examPaper.create({
      data: {
        examId: exam.id,
        name: p.name,
        type: p.type,
        duration: Number(p.durationMinutes) || 0,
        totalMarks: Number(p.totalMarks) || 0,
        totalQuestions: Number(p.totalQuestions) || 0,
        shuffleQuestions: p.shuffleQuestions,
        shuffleOptions: p.shuffleOptions,
        negativeMarking: p.negativeMarking,
      },
    });

    // Create objective questions
    if (p.objectiveQuestions?.length) {
      for (const q of p.objectiveQuestions) {
        await prisma.objectiveQuestion.create({
          data: {
            paperId: paper.id,
            text: q.text,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            optionE: q.optionE,
            correct: q.correct,
            marks: Number(q.marks) || 1,
          },
        });
      }
    }
  }

  // 3) Create settings
  await prisma.examSettings.create({
    data: {
      examId: exam.id,
      allowBackNavigation: settings.allowBackNavigation,
      allowReviewBeforeSubmit: settings.allowReviewBeforeSubmit,
      showScoreAfterExam: settings.showScoreAfterExam,
      autoSubmitOnTimeout: settings.autoSubmitOnTimeout,
      offlineAllowed: settings.offlineAllowed,
      attemptLimit: Number(settings.attemptLimit),
      internalNotes: notes,
    },
  });

  return exam;
};
