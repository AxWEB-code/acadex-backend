import { Router } from "express";
import {
  createSchool,
  getSchools,
  getSchool,
  updateSchool,
  deleteSchool,
  getSchoolBySubdomain, 
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



export default router;
