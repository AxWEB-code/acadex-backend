import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "./utils/sendEmail";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// ---------------------------------------------
//  CORS FIRST
// ---------------------------------------------
app.use(cors());

// ---------------------------------------------
//  FILE UPLOAD ROUTES (MULTER) MUST COME BEFORE express.json()
// ---------------------------------------------
import objImportRoutes from "./api/superadmin/exams/objImport.routes";
app.use("/api/superadmin/exams", objImportRoutes);

// ---------------------------------------------
//  NOW JSON BODY PARSER
// ---------------------------------------------
app.use(express.json());

// ---------------------------------------------
//  LOGGER
// ---------------------------------------------
app.use((req, _res, next) => {
  console.log(`📩 ${req.method} ${req.url}`);
  next();
});



// ---------------------------------------------
//  IMPORT ROUTES
// ---------------------------------------------
import schoolRoutes from "./routes/schoolRoutes";
import departmentRoutes from "./routes/departmentRoutes";
import studentRoutes from "./routes/studentRoutes";
import authRoutes from "./routes/authRoutes";
import approvalRoutes from "./routes/approvalRoutes";

import examRoutes from "./modules/exam/examRoutes";
import offlineRoutes from "./modules/offline/offlineRoutes";
import syncRoutes from "./modules/offline/sync/syncRoutes";

import superadminSchools from "./routes/superadmin/schools/index";
import superadminStudents from "./routes/superadmin/schools/students";
import superadminExams from "./routes/superadmin/schools/exams";
import superadminAdmins from "./routes/superadmin/schools/admins";
import superadminResults from "./routes/superadmin/schools/results";

import superDepartmentRoutes from "./api/superadmin/schools/departments.routes";

// ---------------------------------------------
//  MOUNT ROUTES
// ---------------------------------------------
app.use("/api/schools", schoolRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/approvals", approvalRoutes);

app.use("/api/exams", examRoutes);
app.use("/api/offline", offlineRoutes);
app.use("/api/sync", syncRoutes);

app.use("/api/superadmin/schools", superadminSchools);
app.use("/api/superadmin/schools", superadminStudents);
app.use("/api/superadmin/schools", superadminExams);
app.use("/api/superadmin/schools", superadminAdmins);
app.use("/api/superadmin/schools", superadminResults);

app.use("/api/superadmin/schools", superDepartmentRoutes);

// ---------------------------------------------
//  REMOVE OLD / WRONG ROUTES (DO NOT RE-ADD)
// ---------------------------------------------
// ❌ app.use("/api/superadmin/schools/:id/exams", require(...))
// ❌ Duplicate cors()
// ❌ Duplicate express.json()
// ❌ Duplicate departmentRoutes
// ❌ Any second objImportRoutes

// ---------------------------------------------
//  TEST ROUTES
// ---------------------------------------------
app.get("/", (_req, res) => {
  res.json({
    status: "OK",
    message: "🎓 AcadeX API is running successfully!",
  });
});

app.get("/ping", (_req, res) => res.send("pong 🚀"));

app.get("/test-email", async (_req, res) => {
  try {
    await sendEmail({
      to: "gozimarvis@gmail.com",
      subject: "AcadeX Test Email",
      text: "SMTP working!",
    });
    res.send("Email sent!");
  } catch (err) {
    res.status(500).send("Email failed: " + err);
  }
});

// ---------------------------------------------
//  GLOBAL ERROR HANDLER
// ---------------------------------------------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Global Error Handler:", err);
  res.status(500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

// ---------------------------------------------
//  START SERVER
// ---------------------------------------------
async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
}

startServer();
