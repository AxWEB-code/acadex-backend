// src/api/superadmin/exams/objImport.routes.ts
import { Router } from "express";
import multer from "multer";
import { parseObjectiveFile } from "../../../controllers/objImport.controller";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/parse-obj",
  (req, res, next) => {
    upload.single("file")(req, res, function (err: any) {
      if (err) {
        console.error("Multer upload error:", err);
        return res.status(400).json({
          error: "Upload error",
          details: err.message,
        });
      }
      next();
    });
  },
  parseObjectiveFile
);

export default router;
