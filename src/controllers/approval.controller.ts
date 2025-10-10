// controllers/approval.controller.ts
import { Request, Response } from "express";
import prisma from "../prisma";

export const approveStudent = async (req: Request, res: Response) => {
  try {
    const { studentId, approvedBy } = req.body;

    const student = await prisma.student.update({
      where: { id: Number(studentId) },
      data: {
        approvalStatus: "approved",
        approvedBy,
        approvedAt: new Date(),
      },
    });

    res.json({ message: "Student approved successfully", student });
  } catch (error: any) {
    res.status(500).json({ message: "Approval failed", error: error.message });
  }
};

export const rejectStudent = async (req: Request, res: Response) => {
  try {
    const { studentId, reason } = req.body;

    const student = await prisma.student.update({
      where: { id: Number(studentId) },
      data: {
        approvalStatus: "rejected",
        rejectionReason: reason,
      },
    });

    res.json({ message: "Student rejected successfully", student });
  } catch (error: any) {
    res.status(500).json({ message: "Rejection failed", error: error.message });
  }
};
