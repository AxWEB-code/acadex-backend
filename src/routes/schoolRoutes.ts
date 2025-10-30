import { Router } from "express";
import {
  createSchool,
  getSchools,
  getSchool,
  updateSchool,
  deleteSchool,
  getSchoolBySubdomain,
  verifySchoolCode, // Add this import
} from "../controllers/schoolController";

const router = Router();

// Test route
router.get("/test", (req, res) => {
  console.log("✅ /api/schools/test hit");
  res.json({ message: "School routes working 🚀" });
});

// CRUD routes
router.post("/", createSchool);
router.get("/find/:subdomain", getSchoolBySubdomain); 
router.get("/", getSchools);
router.get("/:id", getSchool);
router.put("/:id", updateSchool);
router.delete("/:id", deleteSchool);

// ✅ Add school code verification route
router.post("/verify-code", verifySchoolCode);

export default router;