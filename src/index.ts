import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

console.log("🔄 Starting server...");

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(cors());

// ✅ Import Routes
try {
  console.log("🔄 Importing routes...");

  const schoolRoutes = require("./routes/schoolRoutes").default;
  const departmentRoutes = require("./routes/departmentRoutes").default;
  const studentRoutes = require("./routes/studentRoutes").default;

  // 🆕 You’ll later add:
  // const authRoutes = require("./routes/authRoutes").default;
  // const approvalRoutes = require("./routes/approvalRoutes").default;
  // const performanceRoutes = require("./routes/performanceRoutes").default;

  console.log("✅ Routes imported successfully");

  // ✅ Mount routes
  app.use("/api/schools", schoolRoutes);
  app.use("/api/departments", departmentRoutes);
  app.use("/api/students", studentRoutes);
  // app.use("/api/auth", authRoutes);
  // app.use("/api/approvals", approvalRoutes);
  // app.use("/api/performance", performanceRoutes);

  console.log("✅ Routes mounted successfully");
} catch (error) {
  console.error("❌ Error importing routes:", error);
  process.exit(1);
}

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

import { protect, isAdmin } from "./middleware/authMiddleware";

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
