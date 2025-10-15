import { Request, Response } from "express";
import { handleUpload, handleDownload } from "./syncService";

// Upload unsynced results from offline
export const uploadSyncData = async (req: Request, res: Response) => {
  try {
    const data = req.body; // results, students, exams, etc.
    const result = await handleUpload(data);
    res.status(200).json({ message: "Sync upload successful", result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Download new exams or student data
export const downloadSyncData = async (req: Request, res: Response) => {
  try {
    const result = await handleDownload();
    res.status(200).json({ message: "Sync download successful", data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
