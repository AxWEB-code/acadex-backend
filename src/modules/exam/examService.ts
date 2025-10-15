import prisma from "../../prisma";
import { generateExamCode, validateExamData } from "./examUtils";

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
    schoolId
  } = data;

  const examCode = generateExamCode(isResit);
  let baseData: any = {
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
    isResit,
    createdById,
    schoolId: Number(schoolId)
  };

  // Handle resit exam logic
  if (isResit && linkedExamCode) {
    const linkedExam = await prisma.exam.findUnique({
      where: { examCode: linkedExamCode },
      include: { results: true }
    });

    if (!linkedExam) throw new Error("Linked exam not found");

    // Get failed courses (you can customize the passing score)
    const failedCourses = linkedExam.results
      .filter((result: any) => (result.score || 0) < 50)
      .map((result: any) => result.courseId);

    baseData.linkedExamId = linkedExam.id;
    baseData.examTitle = `${linkedExam.examTitle} (Resit)`;
    
    // Store failed courses in metadata (you can create a separate field for this)
    baseData.failedCourses = failedCourses;
  }

  const newExam = await prisma.exam.create({
    data: baseData,
    include: {
      school: true,
      questions: true,
      results: true
    }
  });

  return newExam;
};

export const getExams = async (filters: any = {}) => {
  const { schoolId, status, page = 1, limit = 10 } = filters;
  
  const where: any = {};
  if (schoolId) where.schoolId = Number(schoolId);
  if (status) where.status = status;

  const exams = await prisma.exam.findMany({
    where,
    include: {
      school: true,
      questions: true,
      results: true,
      _count: {
        select: {
          questions: true,
          results: true
        }
      }
    },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy: { createdAt: "desc" }
  });

  const total = await prisma.exam.count({ where });

  return {
    exams,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };
};

export const getExamById = async (id: string) => {
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      school: true,
      questions: {
        include: {
          course: true
        }
      },
      results: {
        include: {
          student: true,
          course: true
        }
      },
      notifications: true
    }
  });

  if (!exam) throw new Error("Exam not found");
  return exam;
};

export const approveExam = async (id: string) => {
  const exam = await prisma.exam.findUnique({ where: { id } });
  if (!exam) throw new Error("Exam not found");

  const updatedExam = await prisma.exam.update({
    where: { id },
    data: { status: "APPROVED" }
  });

  // Create notification
  await prisma.examNotification.create({
    data: {
      examId: id,
      message: `Exam "${exam.examTitle}" has been approved and is now live.`
    }
  });

  return updatedExam;
};


export const updateExamStatus = async (id: string, status: string) => {
  const validStatuses = ["PENDING", "APPROVED", "LIVE", "CLOSED"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  const exam = await prisma.exam.update({
    where: { id },
    data: { status }
  });

  return exam;
};