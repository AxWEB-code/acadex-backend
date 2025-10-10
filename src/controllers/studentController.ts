import { Request, Response } from "express";
import prisma from "../prisma";
import bcrypt from "bcryptjs";

// 🧩 Function to generate global roll number
async function generateRollNumber() {
  const lastStudent = await prisma.student.findFirst({
    orderBy: { id: "desc" },
  });

  const currentYear = new Date().getFullYear();
  const lastNumber = lastStudent
    ? parseInt(lastStudent.rollNumber.split("-").pop() || "0", 10)
    : 0;

  const nextNumber = lastNumber + 1;
  const formattedNumber = nextNumber.toString().padStart(3, "0");

  return `adx-${currentYear}-${formattedNumber}`;
}

// 🧩 Create a new student
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
      departmentId,
    } = req.body;

    // Validate required fields
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

    // 🔹 Get school details
    const school = await prisma.school.findUnique({
      where: { id: Number(schoolId) },
    });
    if (!school) return res.status(404).json({ message: "School not found" });

    // 🔹 Validate department and admission format (if provided)
    let admissionFormatValid = true;
    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (department?.admissionFormatRegex) {
        const regex = new RegExp(department.admissionFormatRegex);
        admissionFormatValid = regex.test(admissionNo);

        if (!admissionFormatValid) {
          return res.status(400).json({
            message: `Admission number must match department format: ${department.admissionFormatPreview}`,
          });
        }
      }
    }

    // 🔹 Generate roll number
    const rollNumber = await generateRollNumber();

    // 🔹 Default performance JSON
    const performance = {
      exams: [],
      averageScore: 0,
      lastUpdated: null,
    };

    // 🔹 Detect school type → term / semester
    let term: string | null = null;
    let semester: string | null = null;
    if (school.schoolType === "HIGH_SCHOOL") term = "First Term";
    else if (school.schoolType === "TERTIARY") semester = "First Semester";

    // 🔹 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Check if admission number already exists within this department and school
    const existingAdmission = await prisma.student.findFirst({
      where: {
        admissionNo,
        departmentId: departmentId || undefined,
        schoolId: Number(schoolId),
      },
    });

    if (existingAdmission) {
      return res.status(409).json({
        message: "Admission number already exists for this department/school.",
      });
    }

    // 🔹 Create student
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
        departmentId: departmentId || null,
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
  } catch (error: any) {
    console.error("❌ Student creation error:", error);

    // 🔹 Handle unique roll number conflicts gracefully
    if (error.code === "P2002" && error.meta?.target?.includes("rollNumber")) {
      return res.status(409).json({
        message: "Duplicate roll number detected. Please try again.",
      });
    }

    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


// Get single student by ID
export const getStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id: Number(id) },
      include: { school: true, department: true }
    });
    
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    
    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Update student
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.update({
      where: { id: Number(id) },
      data: req.body,
      include: { school: true, department: true }
    });
    
    res.json({
      message: "Student updated successfully",
      student
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Student not found" });
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete student
export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.student.delete({
      where: { id: Number(id) }
    });
    
    res.json({ message: "Student deleted successfully" });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Student not found" });
    }
    res.status(500).json({ error: error.message });
  }
};


// 🧩 Get students with role-based filtering
export const getStudents = async (req: Request, res: Response) => {
  try {
    const {
      schoolId, // School admins provide their schoolId
      departmentId,
      level,
      class: studentClass,
      academicYear,
      approvalStatus,
      page = 1,
      limit = 10,
    } = req.query;

    const where: any = {};

    // 🔐 Role-based filtering
    if (schoolId) where.schoolId = Number(schoolId);
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
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.student.count({ where });

    res.json({
      students,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("❌ Get students error:", error);
    res.status(500).json({
      error: error.message || "An unknown error occurred",
    });
  }
};
