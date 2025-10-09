import { Router } from "express";
import { createStudent } from "../controllers/studentController";

const router = Router();

router.post("/", createStudent);

export default router;
