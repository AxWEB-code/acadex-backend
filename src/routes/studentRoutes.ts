import { Router } from "express";
import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  registerStudent,
} from "../controllers/studentController";
import { verifyToken } from "../middleware/authMiddleware";
import prisma from "../prisma";

const router = Router();

// 🧩 CRUD routes
router.post("/", createStudent);
router.get("/", getStudents);
router.get("/:id", getStudent);
router.put("/:id", updateStudent);
router.patch("/:id", updateStudent);
router.delete("/:id", deleteStudent);

// 🧩 Register route
router.post("/register", registerStudent); // ✅ frontend: /api/students/register

// 🧩 Enhanced Login route with full validation
router.post("/login", async (req, res) => {
  try {
    const { email, password, schoolSubdomain } = req.body;

    // 🔍 Find the student based on email + school
    const student = await prisma.student.findFirst({
      where: { email, school: { subdomain: schoolSubdomain } },
    });

    if (!student) {
      return res.status(404).json({
        error: "No account found with this email.",
        code: "NO_ACCOUNT",
      });
    }

    // 🔐 Validate password
    const bcrypt = await import("bcryptjs");
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({
        error: "Incorrect password. Please try again.",
        code: "WRONG_PASSWORD",
      });
    }

    // ⚠️ Check approval status
    if (student.approvalStatus === "pending") {
      return res.status(403).json({
        error:
          "Your account is still pending approval. You’ll be able to log in once approved by your school admin.",
        code: "PENDING_APPROVAL",
      });
    }

    if (student.approvalStatus === "rejected") {
      return res.status(403).json({
        error:
          "Your account was rejected by the school admin. Please contact your institution for assistance.",
        code: "REJECTED",
      });
    }

    if (student.status !== "active") {
      return res.status(403).json({
        error:
          "Your account is currently inactive. Please contact the admin to reactivate your access.",
        code: "INACTIVE",
      });
    }

    // ✅ Issue JWT token
    const jwt = await import("jsonwebtoken");
    const token = jwt.sign(
      { id: student.id, email: student.email, role: "student" },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        approvalStatus: student.approvalStatus,
        status: student.status,
        schoolSubdomain,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🧩 Protected route (profile)
router.get("/profile/me", verifyToken, async (req: any, res) => {
  try {
    if (!req.user?.id)
      return res.status(400).json({ error: "Missing user ID in token" });

    const student = await prisma.student.findUnique({
      where: { id: Number(req.user.id) },
      include: { school: true, department: true },
    });

    if (!student)
      return res.status(404).json({ error: "Student not found" });

    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
