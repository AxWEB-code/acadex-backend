import { Router, Request, Response } from "express"; // Add Request and Response imports
import prisma from "../prisma";
import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  registerStudent,
  loginStudent,
} from "../controllers/studentController";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

// CRUD
router.post("/", createStudent);
router.get("/", getStudents);
router.get("/:id", getStudent);
router.put("/:id", updateStudent);
router.patch("/:id", updateStudent);
router.delete("/:id", deleteStudent);

// Auth
router.post("/register", registerStudent);
router.post("/login", loginStudent);

// Protected profile route
router.get("/profile/me", verifyToken, async (req: any, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.id },
      include: { school: true, department: true },
    });
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Temporary debug endpoint
router.post("/debug-register", async (req: Request, res: Response) => {
  try {
    console.log("🔍 DEBUG Request body:", JSON.stringify(req.body, null, 2));
    console.log("🔍 DEBUG Headers:", req.headers);
    
    // Test minimal required fields
    const testData = {
      firstName: "Test",
      lastName: "User", 
      email: `test${Date.now()}@test.com`,
      password: "test123",
      gender: "Male",
      schoolSubdomain: req.body.schoolSubdomain || "ecns"
    };
    
    console.log("🔍 DEBUG Test data:", testData);
    
    // Test the school lookup
    const school = await prisma.school.findUnique({
      where: { subdomain: testData.schoolSubdomain },
    });
    
    if (!school) {
      return res.status(400).json({ error: `School not found: ${testData.schoolSubdomain}` });
    }
    
    console.log("✅ DEBUG School found:", school.name);
    
    res.json({ 
      message: "Debug test passed", 
      school: school.name,
      testData 
    });
    
  } catch (error: any) {
    console.error("❌ DEBUG Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;