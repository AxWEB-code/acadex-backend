import { Router } from "express";
import { uploadSyncData, downloadSyncData } from "./syncController";

const router = Router();

router.post("/upload", uploadSyncData);
router.get("/download", downloadSyncData);

export default router;
