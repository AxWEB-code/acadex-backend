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
      academicYear,
      level,
      term,
      semester,
      class: className,
    } = req.body;

    // 🔍 Step 1 — Validate fields
    if (
      !admissionNo ||
      !rollNumber ||
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !schoolId ||
      !departmentId
    ) {
      return res.status(400).json({
        message: "Missing required fields.",
      });
    }

    // 🔍 Step 2 — Validate that school exists
    const school = await prisma.school.findUnique({
      where: { id: Number(schoolId) },
    });
    if (!school) {
      return res.status(404).json({ message: "School not found." });
    }

    // 🔍 Step 3 — Validate department belongs to this school
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department || department.schoolId !== Number(schoolId)) {
      return res.status(400).json({
        message: "Invalid department for this school.",
      });
    }

    // 🔍 Step 4 — Check duplicates
    const existing = await prisma.student.findFirst({
      where: { OR: [{ rollNumber }, { email }] },
    });
    if (existing) {
      return res.status(400).json({
        message: "Student already exists with this roll number or email.",
      });
    }

    // 🔐 Step 5 — Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Step 6 — Create new student
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
        departmentId,
        academicYear,
        level,
        term,
        semester,
        class: className,
        status: "pending",
        approvalStatus: "pending",
      },
    });

    return res.status(201).json({
      message: "✅ Registration successful. Awaiting approval.",
      student: {
        id: newStudent.id,
        rollNumber: newStudent.rollNumber,
        email: newStudent.email,
        fullName: `${newStudent.firstName} ${newStudent.lastName}`,
        departmentId: newStudent.departmentId,
        status: newStudent.status,
      },
    });
  } catch (error: any) {
    console.error("registerStudent error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


/**
 * ✅ Student Login (with Remember Me)
 */
export const loginStudent = async (req: Request, res: Response) => {
  try {
    const { rollNumber, password, rememberMe } = req.body;

    if (!rollNumber || !password) {
      return res.status(400).json({
        message: "Roll number and password required.",
      });
    }

    const student = await prisma.student.findUnique({
      where: { rollNumber },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const validPassword = await bcrypt.compare(password, student.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password." });
    }

    if (student.approvalStatus !== "approved") {
      return res.status(403).json({
        message: "Your account is pending approval by the admin.",
      });
    }

    // ⏳ Token expiry based on rememberMe flag
    const expiresIn = rememberMe ? "30d" : "7d";

    const token = jwt.sign(
      { id: student.id, role: "student", schoolId: student.schoolId },
      JWT_SECRET,
      { expiresIn }
    );

    // ✅ Update last login
    await prisma.student.update({
      where: { id: student.id },
      data: { lastLogin: new Date() },
    });

    res.json({
      message: "Login successful",
      token,
      expiresIn,
      student: {
        id: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        email: student.email,
        schoolId: student.schoolId,
        departmentId: student.departmentId,
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
    const { email, password, rememberMe, schoolSubdomain } = req.body;

    // 🔍 Step 1: Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    console.log("🟢 Admin login request:", { email, schoolSubdomain });

    // 🔍 Step 2: Try finding school by subdomain + email
    let school = null;

    if (schoolSubdomain) {
      school = await prisma.school.findFirst({
        where: {
          subdomain: schoolSubdomain,
          adminEmail: email,
        },
      });
      console.log("🔍 Found by subdomain?", !!school);
    }

    // fallback — just in case subdomain is missing
    if (!school) {
      school = await prisma.school.findFirst({
        where: { adminEmail: email },
      });
      console.log("🔍 Found by email fallback?", !!school);
    }

    if (!school) {
      console.log("❌ No school found for this email/subdomain");
      return res.status(404).json({ message: "Admin not found for this email or school." });
    }

    if (!school.adminPassword) {
      console.log("⚠️ Admin password not set for school:", school.id);
      return res.status(400).json({ message: "Admin password not set for this school." });
    }

    // 🔑 Step 3: Compare passwords
    const validPassword = await bcrypt.compare(password, school.adminPassword);
    console.log("🧩 Password match:", validPassword);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password." });
    }

    // 🔐 Step 4: Sign JWT
    const expiresIn = rememberMe ? "30d" : "7d";
    const token = jwt.sign(
      {
        id: school.id,
        role: "admin",
        schoolCode: school.schoolCode,
        subdomain: school.subdomain,
      },
      JWT_SECRET,
      { expiresIn }
    );

    console.log("✅ Admin login successful:", { id: school.id, email: school.adminEmail });

    res.json({
      message: "Admin login successful",
      token,
      expiresIn,
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
      details: error.message,
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

/**
 * ✅ Forgot Password + Reset Password
 */
import nodemailer from "nodemailer";

// Setup Nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


/**
 * 🔹 Forgot Password - Send Reset Link
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Check if student exists
    const student = await prisma.student.findUnique({ where: { email } });
    if (!student) {
      return res.status(404).json({ error: "No student found with this email." });
    }

    // Create reset token
    const token = jwt.sign({ id: student.id }, JWT_SECRET, { expiresIn: "1h" });
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Send email
    await transporter.sendMail({
      from: `"AcadeX Support" <${process.env.GMAIL_USER}>`,
      to: student.email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${student.firstName},</p>
        <p>We received a request to reset your password. Click the link below to create a new one. 
        This link expires in <b>1 hour</b>.</p>
        <a href="${resetLink}" 
           style="background:#2563eb;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;">Reset Password</a>
        <p>If you didn’t request this, please ignore this email.</p>
      `,
    });

    res.json({ message: "✅ Reset link sent successfully to your email." });
  } catch (error: any) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ error: "Failed to send reset email." });
  }
};

/**
 * 🔹 Reset Password - Confirm New Password
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Missing token or new password." });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.student.update({
      where: { id: decoded.id },
      data: { password: hashed },
    });

    res.json({ message: "✅ Password reset successful." });
  } catch (error: any) {
    console.error("resetPassword error:", error);
    res.status(400).json({ error: "Invalid or expired reset token." });
  }
};
