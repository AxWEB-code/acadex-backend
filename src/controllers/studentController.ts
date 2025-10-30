import { Request, Response } from "express";
import prisma from "../prisma";
import bcrypt from "bcryptjs";
import { generateRollNumber } from "../utils/roll";

// 🧩 Create a new student (with safer rollNumber + retry on collision)
export const createStudent = async (req: Request, res: Response) => {
  try {
    const {
      admissionNo, // from school input
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
      schoolSubdomain, // ✅ new flexible field
    } = req.body;

    // 🧩 1. Validate base fields (email, name, etc.)
    if (!admissionNo || !firstName || !lastName || !gender || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🧩 2. Resolve school
    let resolvedSchoolId = schoolId ? Number(schoolId) : null;
    let school = null;

    if (!resolvedSchoolId && schoolSubdomain) {
      school = await prisma.school.findUnique({
        where: { subdomain: schoolSubdomain },
      });
      if (!school) {
        return res.status(404).json({ message: "School not found for that subdomain" });
      }
      resolvedSchoolId = school.id;
    }

    if (!resolvedSchoolId) {
      return res.status(400).json({ message: "Missing schoolId or schoolSubdomain" });
    }

    // Ensure we have the school (for defaults later)
    if (!school) {
      school = await prisma.school.findUnique({
        where: { id: resolvedSchoolId },
      });
      if (!school) return res.status(404).json({ message: "School not found" });
    }

    // 🧩 3. Resolve department
    let resolvedDepartmentId = departmentId ?? null;
    if (!resolvedDepartmentId && department) {
      const foundDept = await prisma.department.findFirst({
        where: {
          name: { equals: department, mode: "insensitive" },
          schoolId: resolvedSchoolId,
        },
      });
      if (foundDept) resolvedDepartmentId = foundDept.id;
    }

    // 🧩 4. Admission format validation
    let admissionFormatValid = true;
    if (resolvedDepartmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: resolvedDepartmentId },
      });
      if (dept?.admissionFormatRegex) {
        const rx = new RegExp(dept.admissionFormatRegex);
        admissionFormatValid = rx.test(admissionNo);
        if (!admissionFormatValid) {
          return res.status(400).json({
            message: `Admission number must match department format: ${dept.admissionFormatPreview}`,
          });
        }
      }
    }

    // 🧩 5. Ensure admission number uniqueness
    const clash = await prisma.student.findFirst({
      where: {
        admissionNo,
        schoolId: resolvedSchoolId,
        ...(resolvedDepartmentId ? { departmentId: resolvedDepartmentId } : {}),
      },
      select: { id: true },
    });
    if (clash) {
      return res.status(409).json({
        message: "Admission number already exists for this department/school.",
      });
    }

    // 🧩 6. Defaults
    const nowYear = new Date().getFullYear().toString();
    const effectiveAcademicYear = academicYear ?? nowYear;
    let effectiveTerm: string | null = term ?? null;
    let effectiveSemester: string | null = semester ?? null;

    if (!term && !semester) {
      if (school.schoolType === "HIGH_SCHOOL") effectiveTerm = "First Term";
      if (school.schoolType === "TERTIARY") effectiveSemester = "First Semester";
    }

    // 🧩 7. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🧩 8. Generate unique rollNumber (safe retry)
    const MAX_RETRIES = 5;
    let created: any = null;
    let attempt = 0;

    while (true) {
      attempt += 1;
      const rollNumber = await generateRollNumber();
      try {
        created = await prisma.student.create({
          data: {
            rollNumber,
            admissionNo,
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
            schoolId: resolvedSchoolId,
            departmentId: resolvedDepartmentId,
            performance: {
              exams: [],
              averageScore: 0,
              lastUpdated: null,
            },
            admissionFormatValid,
            approvalStatus: "pending",
            approvedBy: null,
            approvedAt: null,
            subdomain: school.subdomain,
            status: "pending",
          },
        });
        break;
      } catch (error: any) {
        if (
          error?.code === "P2002" &&
          Array.isArray(error?.meta?.target) &&
          error.meta.target.includes("rollNumber")
        ) {
          if (attempt >= MAX_RETRIES) {
            return res.status(409).json({
              message: "Could not allocate unique roll number. Please retry.",
            });
          }
          continue;
        }
        throw error;
      }
    }

    // ✅ Success
    return res.status(201).json({
      message: "Student created successfully",
      student: {
        id: created.id,
        rollNumber: created.rollNumber,
        admissionNo: created.admissionNo,
        fullName: `${created.firstName} ${created.lastName}`,
        email: created.email,
        schoolId: created.schoolId,
        departmentId: created.departmentId,
        approvalStatus: created.approvalStatus,
        status: created.status,
        academicYear: created.academicYear,
        term: created.term,
        semester: created.semester,
        class: created.class,
      },
    });
  } catch (error: any) {
    console.error("❌ Student creation error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error?.message ?? String(error),
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
