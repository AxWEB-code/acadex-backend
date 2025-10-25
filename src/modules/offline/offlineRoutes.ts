import express, { Request, Response } from "express";
import {
  createOfflineExam,
  saveOfflineResult,
  getUnsyncedResults,
} from "./offlineService";

const router = express.Router();

/* ---------------- OFFLINE EXAM ROUTES ---------------- */

// ✅ Create offline exam
router.post("/exam", async (req: Request, res: Response) => {
  try {
    const exam = await createOfflineExam(req.body);
    res.status(201).json({ success: true, data: exam });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Save offline result
router.post("/result", async (req: Request, res: Response) => {
  try {
    const result = await saveOfflineResult(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Get unsynced results (for testing or debugging)
router.get("/unsynced", async (_req: Request, res: Response) => {
  try {
    const results = await getUnsyncedResults();
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Default test route
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "Offline API active ✅" });
});

export default router;
