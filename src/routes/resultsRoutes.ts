import { Router } from "express";
import { getStudentResult } from "../controllers/resultsController";

const router = Router();

router.post("/get-result", getStudentResult);

export default router;
