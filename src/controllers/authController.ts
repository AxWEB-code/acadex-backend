import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/**
 * Helper: safer roll number with quick retry to reduce race conditions.
 */
async function generateRollNumberWithRetry(retries = 5) {
  for (let i = 0; i < retries; i++) {
    const last = await prisma.student.findFirst({ orderBy: { id: "desc" } });
    const currentYear = new Date().getFullYear();
    const lastNum = last ? parseInt((last.rollNumber || "").split("-").pop() || "0", 10) : 0;
    const next = lastNum + 1;
    const formatted = next.toString().padStart(3, "0");
    const candidate = `adx-${currentYear}-${formatted}`;

    const exists = await prisma.student.findUnique({ where: { rollNumber: candidate } });
    if (!exists) return candidate;
    // otherwise loop and try again
  }
  // fallback with timestamp (very unlikely)
  return `adx-${new Date().getFullYear()}-${Date.now()}`;
}

/**
 * Register Student
 */
export const registerStudent = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      departmentId,
      admissionNo,
      gender,
      schoolId,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !departmentId || !admissionNo || !gender || !schoolId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // email uniqueness
    const existingEmail = await prisma.student.findUnique({ where: { email } });
    if (existingEmail) return res.status(409).json({ message: "Email already registered" });

    // validate department exists and optional admission format
    const department = await prisma.department.findUnique({ where: { id: String(departmentId) } });
    if (!department) return res.status(404).json({ message: "Department not found" });

    if (department.admissionFormatRegex) {
      const regex = new RegExp(department.admissionFormatRegex);
      if (!regex.test(admissionNo)) {
        return res.status(400).json({
          message: `Admission number must match department format: ${department.admissionFormatPreview || department.admissionFormatRegex}`,
        });
      }
    }

    // ensure admissionNo uniqueness *within* this department+school
    const existingAdmission = await prisma.student.findFirst({
      where: { admissionNo, departmentId: departmentId, schoolId: Number(schoolId) },
    });
    if (existingAdmission) {
      return res.status(409).json({ message: "Admission number already used in this department" });
    }

    // hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // generate rollNumber
    const rollNumber = await generateRollNumberWithRetry(5);

    // create
    const student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        admissionNo,
        rollNumber,
        departmentId: String(departmentId),
        gender,
        schoolId: Number(schoolId),
        approvalStatus: "pending",
        isActive: true,
        subdomain: undefined, // will be set if you want to copy school.subdomain
      },
    });

    res.status(201).json({
      message: "Student registered successfully. Await admin approval.",
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        admissionNo: student.admissionNo,
        rollNumber: student.rollNumber,
        approvalStatus: student.approvalStatus,
      },
    });
  } catch (error: any) {
    console.error("❌ Register Error:", error);
    // Prisma duplicate key
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Duplicate value error", meta: error.meta });
    }
    res.status(500).json({ message: "Server error", error: error.message || error });
  }
};

/**
 * Login Student (by admissionNo). Prefer sending schoolId for exact match.
 */
export const loginStudent = async (req: Request, res: Response) => {
  try {
    const { admissionNo, password, schoolId } = req.body;
    if (!admissionNo || !password) return res.status(400).json({ message: "Admission number and password required" });

    const whereAny: any = { admissionNo };
    if (schoolId) whereAny.schoolId = Number(schoolId);

    const student = await prisma.student.findFirst({ where: whereAny });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const valid = await bcrypt.compare(password, student.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: student.id, role: "student", schoolId: student.schoolId }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      token,
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        rollNumber: student.rollNumber,
        approvalStatus: student.approvalStatus,
      },
    });
  } catch (error: any) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Admin login (school admin). Expects adminEmail & adminPassword stored on School.
 * Produces token with role 'admin' and schoolId.
 */
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email & password required" });

    const school = await prisma.school.findFirst({ where: { adminEmail: email } });
    if (!school || !school.adminPassword) return res.status(404).json({ message: "Admin not found" });

    const ok = await bcrypt.compare(password, school.adminPassword);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ role: "admin", schoolId: school.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ message: "Admin login successful", token, school: { id: school.id, name: school.name } });
  } catch (error: any) {
    console.error("❌ Admin login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
