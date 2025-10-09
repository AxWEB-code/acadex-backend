import { Request, Response } from "express";
import prisma from "../prisma";
import bcrypt from "bcryptjs";

// Function to generate global roll number
async function generateRollNumber() {
  const lastStudent = await prisma.student.findFirst({
    orderBy: { id: "desc" },
  });

  const currentYear = new Date().getFullYear();
  
  // Start from 1 instead of 1000
  const lastNumber = lastStudent
    ? parseInt(lastStudent.rollNumber.split("-").pop() || "0", 10)
    : 0;

  const nextNumber = lastNumber + 1;
  
  // Format as 001, 002, etc.
  const formattedNumber = nextNumber.toString().padStart(3, '0');
  
  return `adx-${currentYear}-${formattedNumber}`;
}

export const createStudent = async (req: Request, res: Response) => {
  try {
    const {
      admissionNo, // from school input
      firstName,
      lastName,
      gender,
      email,
      schoolId,
      password,
      contactNumber,
      dob,
      academicYear,
      level,
    } = req.body;

    if (
      !admissionNo ||
      !firstName ||
      !lastName ||
      !gender ||
      !email ||
      !schoolId ||
      !password
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get school details
    const school = await prisma.school.findUnique({
      where: { id: Number(schoolId) },
    });
    if (!school) return res.status(404).json({ message: "School not found" });

    // Generate system roll number
    const rollNumber = await generateRollNumber();

    // Default performance JSON
    const performance = {
      exams: [],
      averageScore: 0,
      lastUpdated: null,
    };

    // Detect school type → term / semester
    let term: string | null = null;
    let semester: string | null = null;

    if (school.schoolType === "HIGH_SCHOOL") term = "First Term";
    else if (school.schoolType === "TERTIARY") semester = "First Semester";

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student
    const newStudent = await prisma.student.create({
      data: {
        rollNumber, // ✅ System-generated
        admissionNo, // ✅ Provided by school
        firstName,
        lastName,
        gender,
        email,
        password: hashedPassword,
        contactNumber,
        dob: dob ? new Date(dob) : null,
        academicYear,
        level,
        term,
        semester,
        schoolId: Number(schoolId),
        performance,
        approvalStatus: "pending",
        approvedBy: null,
        approvedAt: null,
        subdomain: school.subdomain,
      },
    });

    res.status(201).json({
      message: "Student created successfully",
      student: newStudent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Get students with role-based filtering (Portal admin + School admin)
export const getStudents = async (req: Request, res: Response) => {
  try {
    const { 
      schoolId,           // School admins provide their schoolId
      departmentId, 
      level, 
      class: studentClass, 
      academicYear,
      approvalStatus,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const where: any = {};

    // 🔐 ROLE-BASED ACCESS:
    // - Portal admin: no schoolId = sees ALL students
    // - School admin: provides schoolId = sees only their school
    if (schoolId) {
      where.schoolId = Number(schoolId);
    }
    // If no schoolId provided, portal admin sees everything

    // Add other filters...
    if (departmentId) where.departmentId = departmentId;
    if (level) where.level = level;
    if (studentClass) where.class = studentClass;
    if (academicYear) where.academicYear = academicYear;
    if (approvalStatus) where.approvalStatus = approvalStatus;

    const students = await prisma.student.findMany({
      where,
      include: { school: true, department: true },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.student.count({ where });

    res.json({
      students,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    // FIXED: Add proper error type checking
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unknown error occurred" });
    }
  }
};