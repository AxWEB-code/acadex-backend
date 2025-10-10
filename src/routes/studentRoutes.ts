import { Router } from "express";
import { 
  createStudent, 
  getStudents, 
  getStudent, 
  updateStudent, 
  deleteStudent 
} from "../controllers/studentController";

const router = Router();

router.post("/", createStudent);        // CREATE
router.get("/", getStudents);           // READ ALL (with filters)
router.get("/:id", getStudent);         // READ ONE
router.put("/:id", updateStudent);      // UPDATE
router.patch("/:id", updateStudent);    // PARTIAL UPDATE  
router.delete("/:id", deleteStudent);   // DELETE

export default router;