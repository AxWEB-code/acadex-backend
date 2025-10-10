import { Request, Response } from "express";
import prisma from "../prisma";

/**
 * Approve a student (admin action)
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
        approvedBy: admin?.schoolId ? `school-${admin.schoolId}` : `admin-${admin?.id ?? "unknown"}`,
        isActive: true,
      },
    });

    res.json({ message: "Student approved", student: updated });
  } catch (err: any) {
    console.error("approveStudent error:", err);
    if (err?.code === "P2025") return res.status(404).json({ message: "Student not found" });
    res.status(500).json({ message: "Server error", error: err.message || err });
  }
};

/**
 * Reject a student (admin action)
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
        approvedBy: reason || `rejected-by-admin-${admin?.id ?? "unknown"}`,
        isActive: false,
      },
    });

    res.json({ message: "Student rejected", student: updated });
  } catch (err: any) {
    console.error("rejectStudent error:", err);
    if (err?.code === "P2025") return res.status(404).json({ message: "Student not found" });
    res.status(500).json({ message: "Server error", error: err.message || err });
  }
};
