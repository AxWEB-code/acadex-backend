import { Request, Response, NextFunction } from "express";
import prisma from "../../prisma"; // ✅ fixed relative path if this file is under src/modules/exam

/**
 * ✅ Check if the logged-in user is allowed to manage exams
 *  - Super admins can manage all
 *  - School admins can manage exams within their school
 */
export const authorizeExamAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user; // from authMiddleware
    const examId = req.params.id;

    // Skip if no exam ID (for create routes)
    if (!examId) return next();

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { school: true },
    });

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Super Admin can access all exams
    if (user.role === "superadmin") return next();

    // School Admins — only their own school's exams
    if (user.role === "admin" && exam.schoolId === user.schoolId) {
      return next();
    }

    return res.status(403).json({ message: "Access denied to this exam" });
  } catch (error: any) {
    console.error("❌ Exam authorization error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ Validate Exam Creation Input
 * Ensures required fields exist before passing to controller.
 */
export const validateExamCreation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    examTitle,
    mode,
    examTypes,
    sessionYear,
    startDate,
    endDate,
    duration,
    schoolId,
  } = req.body;

  if (
    !examTitle ||
    !mode ||
    !examTypes ||
    !sessionYear ||
    !startDate ||
    !endDate ||
    !duration ||
    !schoolId
  ) {
    return res.status(400).json({
      message: "Missing required exam fields",
      required: [
        "examTitle",
        "mode",
        "examTypes",
        "sessionYear",
        "startDate",
        "endDate",
        "duration",
        "schoolId",
      ],
    });
  }

  next();
};
