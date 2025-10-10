import express from "express";
import { registerStudent, loginStudent, adminLogin } from "../controllers/authController";

const router = express.Router();

router.post("/student/register", registerStudent);
router.post("/student/login", loginStudent);

// admin login
router.post("/admin/login", adminLogin);

export default router;
