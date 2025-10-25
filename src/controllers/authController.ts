import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma";

// Load environment variable for JWT
const JWT_SECRET = process.env.JWT_SECRET || "acadex_secret_key";

/**
 * ✅ Register a new student
 * POST /api/auth/student/register
 */
export const registerStudent = async (req: Request, res: Response) => {
  try {
    const { fullName, admissionNo, password, schoolCode, departmentId, level } = req.body;

    if (!fullName || !admissionNo || !password || !schoolCode) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    // Check for existing student
    const existing = await prisma.student.findUnique({
      where: { admissionNo },
    });
    if (existing) {
      return res.status(400).json({ message: "Admission number already registered." });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    const student = await prisma.student.create({
      data: {
        fullName,
        admissionNo,
        password: hashed,
        schoolCode,
        departmentId: Number(departmentId) || null,
        level: level || "100",
        approvalStatus: "pending",
      },
    });

    res.status(201).json({
      message: "✅ Registration successful, awaiting approval.",
      student: { id: student.id, fullName: student.fullName, admissionNo: student.admissionNo },
    });
  } catch (err: any) {
    console.error("❌ registerStudent error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * ✅ Student Login
 * POST /api/auth/student/login
 */
export const loginStudent = async (req: Request, res: Response) => {
  try {
    const { admissionNo, password } = req.body;

    if (!admissionNo || !password)
      return res.status(400).json({ message: "Admission number and password required." });

    const student = await prisma.student.findUnique({
      where: { admissionNo },
    });
    if (!student)
      return res.status(404).json({ message: "Student not found." });

    const valid = await bcrypt.compare(password, student.password);
    if (!valid)
      return res.status(401).json({ message: "Invalid credentials." });

    if (student.approvalStatus !== "approved")
      return res.status(403).json({ message: "Account pending approval." });

    const token = jwt.sign(
      { id: student.id, role: "student", schoolCode: student.schoolCode },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "✅ Login successful.",
      token,
      student: { id: student.id, fullName: student.fullName, schoolCode: student.schoolCode },
    });
  } catch (err: any) {
    console.error("❌ loginStudent error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * ✅ Admin Login
 * POST /api/auth/admin/login
 */
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { username },
    });
    if (!admin)
      return res.status(404).json({ message: "Admin not found." });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid)
      return res.status(401).json({ message: "Invalid password." });

    const token = jwt.sign(
      { id: admin.id, role: "admin", schoolId: admin.schoolId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "✅ Admin login successful.",
      token,
      admin: { id: admin.id, username: admin.username },
    });
  } catch (err: any) {
    console.error("❌ adminLogin error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
