import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import schoolRoutes from "./routes/schoolRoutes";
import departmentRoutes from "./routes/departmentRoutes";
import studentRoutes from "./routes/studentRoutes";
import authRoutes from "./routes/authRoutes";
import approvalRoutes from "./routes/approvalRoutes";
import { protect, isAdmin } from "./middleware/authMiddleware";
import examRoutes from "./modules/exam/examRoutes";
import offlineRoutes from "./modules/offline/offlineRoutes";
import syncRoutes from "./sync/syncRoutes";

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
router.use("/sync", syncRoutes);

console.log("✅ Routes mounted successfully");

// ✅ Root route
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "🎓 AcadeX API is running successfully!",
  });
});

// ✅ Test route
app.get("/test", (req, res) => {
  res.json({ message: "✅ Test route works!" });
});

// ✅ Protected routes
app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "✅ You are authenticated", user: (req as any).user });
});

app.get("/api/admin-only", protect, isAdmin, (req, res) => {
  res.json({ message: "✅ You are an admin" });
});

// ✅ Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Test URL: http://localhost:${PORT}/test`);
}).on("error", (err) => {
  console.error("❌ Server error:", err);
});