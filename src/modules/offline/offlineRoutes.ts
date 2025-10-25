import { Request, Response } from "express";
import {
  createOfflineExam,
  saveOfflineResult,
  getUnsyncedResults
} from "./offlineService";

export const createOfflineExamHandler = async (req: Request, res: Response) => {
  try {
    const exam = await createOfflineExam(req.body);
    res.status(201).json({ success: true, data: exam });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const saveOfflineResultHandler = async (req: Request, res: Response) => {
  try {
    const result = await saveOfflineResult(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOfflineUnsyncedHandler = async (_req: Request, res: Response) => {
  try {
    const results = await getUnsyncedResults();
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export default router;

