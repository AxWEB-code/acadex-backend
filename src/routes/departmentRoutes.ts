import express from "express";
import {
  createDepartment,
  getDepartments,
  getDepartment,  
  getDepartmentsBySchool,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController";

const router = express.Router();

router.post("/", createDepartment);
router.get("/", getDepartments);
router.get("/:id", getDepartment); 
router.get("/school/:schoolId", getDepartmentsBySchool);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

export default router;
