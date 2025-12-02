import { Router } from "express";
import { createExam } from "../../../controllers/createExam.controller.old";

const router = Router();

router.post("/", createExam);

export default router;
