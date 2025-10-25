import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";

// ✅ Route Imports
import schoolRoutes from "./routes/schoolRoutes";
import departmentRoutes from "./routes/departmentRoutes";
import studentRoutes from "./routes/studentRoutes";
import authRoutes from "./routes/authRoutes";
import approvalRoutes from "./routes/approvalRoutes";
import { protect, isAdmin } from "./middleware/authMiddleware";
import examRoutes from "./modules/exam/examRoutes";
import offlineRoutes from "./modules/offline/offlineRoutes";
import syncRoutes from "./modules/offline/sync/syncRoutes"; // ✅ corrected path

dotenv.config();

console.log("🔄 Starting server...");

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(cors());

// ✅ Mount routes
app.use("/api/schools", schoolRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/offline", offlineRoutes);
app.use("/api/sync", syncRoutes); // ✅ fixed router.use → app.use

console.log("✅ Routes mounted successfully");

// ✅ Root route
app.get("/", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    message: "🎓 AcadeX API is running successfully!",
  });
});

// ✅ Test route
app.get("/test", (req: Request, res: Response) => {
  res.json({ message: "✅ Test route works!" });
});

// ✅ Protected routes
app.get("/api/protected", protect, (req: Request, res: Response) => {
  res.json({
    message: "✅ You are authenticated",
    user: (req as any).user,
  });
});

app.get("/api/admin-only", protect, isAdmin, (req: Request, res: Response) => {
  res.json({ message: "✅ You are an admin" });
});

// ✅ Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Test URL: http://localhost:${PORT}/test`);
}).on("error", (err) => {
  console.error("❌ Server error:", err);
});
