import { Request, Response } from "express";
import prisma from "../prisma";
import bcrypt from "bcryptjs";
import { generateRollNumber } from "../utils/roll";


// ✅ Create one or multiple students
export const createStudent = async (req: Request, res: Response) => {
  try {
    const input = Array.isArray(req.body) ? req.body : [req.body];
    const createdStudents = [];

    for (const studentData of input) {
      const {
        admissionNo,
        firstName,
        lastName,
        gender,
        email,
        password,
        contactNumber,
        dob,
        academicYear,
        level,
        department,
        departmentId,
        class: klass,
        semester,
        term,
        schoolId,
        schoolSubdomain,
        rollNumber, // Optional, can come from your dataset
      } = studentData;

      // 🧩 Validate base fields
      if (!firstName || !lastName || !email || !gender || !password || (!schoolId && !schoolSubdomain)) {
        throw new Error(`Missing required fields for student ${firstName} ${lastName}`);
      }

      // 🧩 Resolve school
      let resolvedSchool = null;
      if (schoolId) {
        resolvedSchool = await prisma.school.findUnique({ where: { id: Number(schoolId) } });
      } else if (schoolSubdomain) {
        resolvedSchool = await prisma.school.findUnique({ where: { subdomain: schoolSubdomain } });
      }

      if (!resolvedSchool) throw new Error(`School not found for ${schoolSubdomain || schoolId}`);

      // 🧩 Resolve department
      let resolvedDepartmentId = departmentId ?? null;
      if (!resolvedDepartmentId && department) {
        const foundDept = await prisma.department.findFirst({
          where: {
            name: { equals: department, mode: "insensitive" },
            schoolId: resolvedSchool.id,
          },
        });
        if (foundDept) resolvedDepartmentId = foundDept.id;
      }

      // 🧩 Default year + semester/term
      const nowYear = new Date().getFullYear().toString();
      const effectiveAcademicYear = academicYear ?? nowYear;
      let effectiveTerm: string | null = term ?? null;
      let effectiveSemester: string | null = semester ?? null;

      if (!term && !semester) {
        if (resolvedSchool.schoolType === "HIGH_SCHOOL") effectiveTerm = "First Term";
        if (resolvedSchool.schoolType === "TERTIARY") effectiveSemester = "First Semester";
      }

      // 🧩 Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 🧩 Safe unique rollNumber (or use provided)
      const MAX_RETRIES = 5;
      let newRoll = rollNumber || null;
      let attempt = 0;
      while (!newRoll) {
        attempt++;
        try {
          const temp = await generateRollNumber();
          const exists = await prisma.student.findUnique({ where: { rollNumber: temp } });
          if (!exists) newRoll = temp;
        } catch {
          if (attempt >= MAX_RETRIES) throw new Error("Failed to generate unique rollNumber");
        }
      }

      // 🧩 Create student
      const created = await prisma.student.create({
        data: {
          rollNumber: newRoll,
          admissionNo: admissionNo ?? newRoll, // fallback
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          gender,
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          contactNumber: contactNumber ?? null,
          dob: dob ? new Date(dob) : null,
          academicYear: effectiveAcademicYear,
          level: level ?? null,
          term: effectiveTerm,
          semester: effectiveSemester,
          class: klass ?? null,
          schoolId: resolvedSchool.id,
          departmentId: resolvedDepartmentId,
          performance: {
            exams: [],
            averageScore: 0,
            lastUpdated: null,
          },
          admissionFormatValid: true,
          approvalStatus: "pending",
          approvedBy: null,
          approvedAt: null,
          subdomain: resolvedSchool.subdomain,
          status: "pending",
        },
      });

      createdStudents.push({
        id: created.id,
        fullName: `${created.firstName} ${created.lastName}`,
        email: created.email,
        school: resolvedSchool.subdomain,
        department,
        rollNumber: created.rollNumber,
      });
    }

    return res.status(201).json({
      message: `✅ ${createdStudents.length} student(s) created successfully`,
      students: createdStudents,
    });
  } catch (error: any) {
    console.error("❌ Student creation error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message || String(error),
    });
  }
};


// Get single student by ID
export const getStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id: Number(id) },
      include: { school: true, department: true },
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
      include: { school: true, department: true },
    });

    res.json({
      message: "Student updated successfully",
      student,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
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
      where: { id: Number(id) },
    });

    res.json({ message: "Student deleted successfully" });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Student not found" });
    }
    res.status(500).json({ error: error.message });
  }
};

// 🧩 Get students with role-based filtering
export const getStudents = async (req: Request, res: Response) => {
  try {
    const {
      schoolId,
      departmentId,
      level,
      class: studentClass,
      academicYear,
      approvalStatus,
      page = 1,
      limit = 10,
    } = req.query;

    const where: any = {};
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
