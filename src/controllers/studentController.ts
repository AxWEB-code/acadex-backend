import { Request, Response } from "express";
import prisma from "../prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateSequentialRollNumber } from "../utils/rollNumber";

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
      } = studentData;

      if (
        !firstName ||
        !lastName ||
        !email ||
        !gender ||
        !password ||
        (!schoolId && !schoolSubdomain)
      ) {
        throw new Error(
          `Missing required fields for student ${firstName} ${lastName}`
        );
      }

      // 🧩 Resolve school
      let resolvedSchool = null;
      if (schoolId) {
        resolvedSchool = await prisma.school.findUnique({
          where: { id: Number(schoolId) },
        });
      } else if (schoolSubdomain) {
        resolvedSchool = await prisma.school.findUnique({
          where: { subdomain: schoolSubdomain },
        });
      }
      if (!resolvedSchool)
        throw new Error(`School not found for ${schoolSubdomain || schoolId}`);

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

      // 🧩 Default academic year + term/semester
      const nowYear = new Date().getFullYear().toString();
      const effectiveAcademicYear = academicYear ?? nowYear;
      let effectiveTerm: string | null = term ?? null;
      let effectiveSemester: string | null = semester ?? null;

      if (!term && !semester) {
        if (resolvedSchool.schoolType === "HIGH_SCHOOL")
          effectiveTerm = "First Term";
        if (resolvedSchool.schoolType === "TERTIARY")
          effectiveSemester = "First Semester";
      }

      // 🧩 Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ Auto-generate global roll number
      const rollNumber = await generateSequentialRollNumber();

      // 🧩 Create student
      const created = await prisma.student.create({
        data: {
          rollNumber,
          admissionNo: admissionNo ?? rollNumber,
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
          approvalStatus: "approved",
          approvedBy: null,
          approvedAt: null,
          subdomain: resolvedSchool.subdomain,
          status: "active",
        },
      });

      createdStudents.push({
        id: created.id,
        fullName: `${created.firstName} ${created.lastName}`,
        email: created.email,
        rollNumber: created.rollNumber,
        school: resolvedSchool.subdomain,
        department,
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

// ✅ Register from frontend (single student)
export const registerStudent = async (req: Request, res: Response) => {
  try {
    console.log("📥 FULL Register request body:", JSON.stringify(req.body, null, 2));
    console.log("📥 Register headers:", req.headers);

    const {
      firstName,
      lastName,
      email,
      password,
      gender,
      dob,
      admissionNo,
      department,
      level,
      class: klass,
      semester,
      term,
      academicYear,
      contactNumber,
      schoolSubdomain,
    } = req.body;

    // 🧩 Validation
    if (!schoolSubdomain)
      return res.status(400).json({ error: "School subdomain is required" });

    if (!email || !password || !firstName || !lastName)
      return res.status(400).json({ error: "Missing required fields" });

    // 🧩 Find school
    const school = await prisma.school.findUnique({
      where: { subdomain: schoolSubdomain },
    });
    if (!school)
      return res.status(404).json({ error: "School not found" });

    // 🧩 Find department (optional)
    let departmentId: string | null = null;
    if (department) {
      const foundDept = await prisma.department.findFirst({
        where: {
          name: { equals: department, mode: "insensitive" },
          schoolId: school.id,
        },
      });
      if (foundDept) departmentId = foundDept.id;
    }

    // 🧩 Check duplicate email
    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ error: "Email already registered" });

    // 🧩 Hash password
    const hashed = await bcrypt.hash(password, 10);

    // 🧩 Generate global roll number
    const rollNumber = await generateSequentialRollNumber();
    console.log("✅ Generated roll number:", rollNumber);

    // 🧩 Create student
    const student = await prisma.student.create({
      data: {
        rollNumber,
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        password: hashed,
        gender,
        dob: dob ? new Date(dob) : null,
        admissionNo: admissionNo || rollNumber,
        level,
        class: klass || null,
        semester: semester || null,
        term: term || null,
        academicYear,
        contactNumber,
        schoolId: school.id,
        departmentId, // ✅ fixed
        subdomain: school.subdomain,
        status: "pending",
        approvalStatus: "pending",
        performance: {
          exams: [],
          averageScore: 0,
          lastUpdated: null,
        },
        admissionFormatValid: true,
      },
    });

    console.log("✅ Student created successfully:", student.id);
    return res.status(201).json({
      message: "✅ Registration successful",
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        rollNumber: student.rollNumber,
      },
    });
  } catch (err: any) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: err.message });
  }
};


// ✅ Login Student
export const loginStudent = async (req: Request, res: Response) => {
  try {
    const { email, password, schoolSubdomain } = req.body;

    if (!email || !password || !schoolSubdomain)
      return res.status(400).json({ error: "Missing credentials" });

    const school = await prisma.school.findUnique({
      where: { subdomain: schoolSubdomain },
    });
    if (!school)
      return res.status(404).json({ error: "School not found" });

    const student = await prisma.student.findFirst({
      where: { email, schoolId: school.id },
    });
    if (!student)
      return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, student.password);
    if (!valid)
      return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: student.id, role: "student", schoolId: school.id },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "7d" }
    );

    res.json({ token, student });
  } catch (err: any) {
    console.error("❌ Student login error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single student
export const getStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id: Number(id) },
      include: { school: true, department: true },
    });
    if (!student)
      return res.status(404).json({ error: "Student not found" });

    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update student
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.update({
      where: { id: Number(id) },
      data: req.body,
      include: { school: true, department: true },
    });

    res.json({ message: "Student updated successfully", student });
  } catch (error: any) {
    if (error.code === "P2025")
      return res.status(404).json({ error: "Student not found" });
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete student
export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.student.delete({ where: { id: Number(id) } });
    res.json({ message: "Student deleted successfully" });
  } catch (error: any) {
    if (error.code === "P2025")
      return res.status(404).json({ error: "Student not found" });
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get all students with filtering + pagination
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


