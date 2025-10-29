import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma";

const JWT_SECRET = process.env.JWT_SECRET || "acadex_secret_key";

/**
 * ✅ Register a new Student
 */
export const registerStudent = async (req: Request, res: Response) => {
  try {
    const {
      admissionNo,
      rollNumber,
      firstName,
      lastName,
      email,
      password,
      gender,
      schoolId,
      departmentId,
    } = req.body;

    if (
      !admissionNo ||
      !rollNumber ||
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !schoolId
    ) {
      return res.status(400).json({
        message: "Missing required fields.",
      });
    }

    const existing = await prisma.student.findFirst({
      where: {
        OR: [{ rollNumber }, { email }],
      },
    });

    if (existing) {
      return res.status(400).json({
        message: "Student already exists with this roll number or email.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = await prisma.student.create({
      data: {
        admissionNo,
        rollNumber,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        gender: gender || "N/A",
        schoolId: Number(schoolId),
        departmentId: departmentId || null,
        status: "pending",
        approvalStatus: "pending",
      },
    });

    return res.status(201).json({
      message: "Registration successful. Awaiting approval.",
      student: {
        id: newStudent.id,
        rollNumber: newStudent.rollNumber,
        email: newStudent.email,
        fullName: `${newStudent.firstName} ${newStudent.lastName}`,
        status: newStudent.status,
      },
    });
  } catch (error: any) {
    console.error("registerStudent error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * ✅ Student Login
 */
export const loginStudent = async (req: Request, res: Response) => {
  try {
    const { rollNumber, password } = req.body;

    if (!rollNumber || !password) {
      return res.status(400).json({
        message: "Roll number and password required.",
      });
    }

    const student = await prisma.student.findUnique({
      where: { rollNumber },
    });

    if (!student)
      return res.status(404).json({ message: "Student not found." });

    const validPassword = await bcrypt.compare(password, student.password);
    if (!validPassword)
      return res.status(401).json({ message: "Invalid password." });

    if (student.approvalStatus !== "approved") {
      return res.status(403).json({
        message: "Your account is pending approval by the admin.",
      });
    }

    const token = jwt.sign(
      { id: student.id, role: "student", schoolId: student.schoolId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      student: {
        id: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        email: student.email,
        schoolId: student.schoolId,
        status: student.status,
      },
    });
  } catch (error: any) {
    console.error("loginStudent error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * ✅ School Admin Login
 */
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required." });

    const school = await prisma.school.findFirst({
      where: { adminEmail: email },
    });

    if (!school)
      return res.status(404).json({ message: "Admin not found for this email." });

    if (!school.adminPassword)
      return res.status(400).json({ message: "Admin password not set." });

    const validPassword = await bcrypt.compare(password, school.adminPassword);
    if (!validPassword)
      return res.status(401).json({ message: "Invalid password." });

    const token = jwt.sign(
      { id: school.id, role: "admin", schoolCode: school.schoolCode },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Admin login successful",
      token,
      admin: {
        schoolId: school.id,
        email: school.adminEmail,
        schoolCode: school.schoolCode,
        subdomain: school.subdomain,
      },
    });
  } catch (error: any) {
    console.error("❌ adminLogin error:", error);
    res.status(500).json({
      message: "Server error during admin login",
      details: error.message || error,
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    });
  }
};

/**
 * ✅ Register a new School (Admin signup)
 */
export const registerSchool = async (req: Request, res: Response) => {
  try {
    const { schoolName, subdomain, adminEmail, adminPassword } = req.body;

    if (!schoolName || !subdomain || !adminEmail || !adminPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingSchool = await prisma.school.findFirst({
      where: {
        OR: [{ subdomain }, { adminEmail }],
      },
    });

    if (existingSchool) {
      return res.status(400).json({ message: "School already exists." });
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const schoolCode = `SCH-${subdomain.toUpperCase()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const newSchool = await prisma.school.create({
      data: {
        name: schoolName,
        subdomain,
        adminEmail,
        adminPassword: hashedPassword,
        schoolCode,
        settings: {},
        permissions: {},
        adminRoles: [],
      },
    });

    res.status(201).json({
      message: "✅ School registered successfully!",
      school: {
        id: newSchool.id,
        name: newSchool.name,
        subdomain: newSchool.subdomain,
        adminEmail: newSchool.adminEmail,
        schoolCode: newSchool.schoolCode,
      },
    });
  } catch (error: any) {
    console.error("registerSchool error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
