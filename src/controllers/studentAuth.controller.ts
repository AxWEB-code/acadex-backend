import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ✅ Register Student
export const registerStudent = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, departmentId, admissionNo } = req.body;

    if (!fullName || !email || !password || !departmentId || !admissionNo)
      return res.status(400).json({ message: "All fields are required" });

    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a roll number (temporary placeholder)
    const rollNumber = `ACX-${Date.now()}`;

    const student = await prisma.student.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        admissionNo,
        rollNumber,
        departmentId: Number(departmentId),
      },
    });

    res.status(201).json({
      message: "Student registered successfully. Await admin approval.",
      student: { id: student.id, fullName: student.fullName, email: student.email },
    });
  } catch (error: any) {
    console.error("❌ Register Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Login Student
export const loginStudent = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const student = await prisma.student.findUnique({ where: { email } });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const valid = await bcrypt.compare(password, student.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: student.id, role: student.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      student: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        role: student.role,
        status: student.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
