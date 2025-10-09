import express from "express";

console.log("🔄 Starting server...");

const app = express();
app.use(express.json());

// Import routes with error handling
try {
  console.log("🔄 Importing routes...");
  
  const schoolRoutes = require("./routes/schoolRoutes").default;
  const departmentRoutes = require("./routes/departmentRoutes").default;
  const studentRoutes = require('./routes/studentRoutes').default;


  console.log("✅ Routes imported successfully");
  
  app.use("/api/schools", schoolRoutes);
  app.use("/api/departments", departmentRoutes);
  app.use("/api/students", studentRoutes);
  
  console.log("✅ Routes mounted successfully");
  
} catch (error) {
  console.error("❌ Error importing routes:", error);
  process.exit(1);
}

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Test route works!" });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Test URL: http://localhost:${PORT}/test`);
}).on('error', (err) => {
  console.error('❌ Server error:', err);
});