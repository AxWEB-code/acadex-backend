import { Request, Response } from "express";
import prisma from "../prisma";

/**
 * ✅ Approve a student (admin action)
 * POST /api/approvals/students/:id/approve
 */
export const approveStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = (req as any).user;

    const updated = await prisma.student.update({
      where: { id: Number(id) },
      data: {
        approvalStatus: "approved",
        approvedAt: new Date(),
        approvedBy: admin?.schoolId
          ? `school-${admin.schoolId}`
          : `admin-${admin?.id ?? "unknown"}`,
        isActive: true,
      },
    });

    return res.json({ message: "✅ Student approved", student: updated });
  } catch (err: any) {
    console.error("❌ approveStudent error:", err);
    if (err?.code === "P2025")
      return res.status(404).json({ message: "Student not found" });
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
};

/**
 * ✅ Reject a student (admin action)
 * POST /api/approvals/students/:id/reject
 * body: { reason?: string }
 */
export const rejectStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const admin = (req as any).user;

    const updated = await prisma.student.update({
  where: { id: Number(id) },
  data: {
    approvalStatus: "rejected",
    approvedAt: new Date(),
    approvedBy: admin?.schoolId ? `school-${admin.schoolId}` : `admin-${admin?.id ?? "unknown"}`,
    isActive: false,
  },
});


    return res.json({ message: "🚫 Student rejected", student: updated });
  } catch (err: any) {
    console.error("❌ rejectStudent error:", err);
    if (err?.code === "P2025")
      return res.status(404).json({ message: "Student not found" });
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
};


/**
 * ✅ Get all pending students (for admin dashboard)
 * GET /api/approvals/students/pending
 */
export const getPendingStudents = async (req: Request, res: Response) => {
  try {
    const { schoolId } = (req as any).user || {};

    const whereClause: any = { approvalStatus: "pending" };
    if (schoolId) whereClause.schoolId = schoolId;

    const students = await prisma.student.findMany({
      where: whereClause,
      include: { department: true, school: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      count: students.length,
      students,
    });
  } catch (err: any) {
    console.error("❌ getPendingStudents error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


/**
 * ✅ Get all approved students
 * GET /api/approvals/students/approved
 */
export const getApprovedStudents = async (req: Request, res: Response) => {
  try {
    const { schoolId } = (req as any).user || {};

    const whereClause: any = { approvalStatus: "approved" };
    if (schoolId) whereClause.schoolId = schoolId;

    const students = await prisma.student.findMany({
      where: whereClause,
      include: { department: true, school: true },
      orderBy: { updatedAt: "desc" },
    });

    res.json({
      count: students.length,
      students,
    });
  } catch (err: any) {
    console.error("❌ getApprovedStudents error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
