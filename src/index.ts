import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "./utils/sendEmail";

// ✅ Initialize environment
console.log("🔄 Booting AcadeX backend...");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Log each request (for Render debugging)
app.use((req, _res, next) => {
  console.log(`📩 ${req.method} ${req.url}`);
  next();
});

// ✅ Import Routes
import schoolRoutes from "./routes/schoolRoutes";
import departmentRoutes from "./routes/departmentRoutes";
import studentRoutes from "./routes/studentRoutes";
import authRoutes from "./routes/authRoutes";
import approvalRoutes from "./routes/approvalRoutes";
import { protect, isAdmin } from "./middleware/authMiddleware";
import examRoutes from "./modules/exam/examRoutes";
import offlineRoutes from "./modules/offline/offlineRoutes";
import syncRoutes from "./modules/offline/sync/syncRoutes";


// ✅ Mount Routes
app.use("/api/schools", schoolRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/offline", offlineRoutes);
app.use("/api/sync", syncRoutes);

console.log("✅ Routes mounted successfully");

// ✅ Root Route
app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "OK",
    message: "🎓 AcadeX API is running successfully!",
  });
});

// ✅ Health Check Route
app.get("/ping", (_req: Request, res: Response) => {
  res.status(200).send("pong 🚀");
});

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected", uptime: process.uptime() });
  } catch {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});



// ✅ Protected Routes
app.get("/api/protected", protect, (req: Request, res: Response) => {
  res.json({
    message: "✅ You are authenticated",
    user: (req as any).user,
  });
});

app.get("/api/admin-only", protect, isAdmin, (_req: Request, res: Response) => {
  res.json({ message: "✅ You are an admin" });
});

// ✅ Global Error Handler (prevents Render 502 crashes)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Global error handler caught:", err);
  res.status(500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

// ✅ Start Server only after DB connects
async function startServer() {
  try {
    console.log("🔗 Connecting to database...");
    await prisma.$connect();
    console.log("✅ Database connection established successfully.");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Test URL: http://localhost:${PORT}/ping`);
    });
  } catch (err: any) {
    console.error("❌ Failed to connect to database:", err.message);
    process.exit(1);
  }
}

app.use(
  cors({
    origin: "*", // ✅ temporarily allow all origins for testing
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// in your index.ts or a temporary route file


app.get("/test-email", async (_req, res) => {
  try {
    await sendEmail({
      to: "yourpersonalemail@gmail.com",
      subject: "✅ AcadeX Test Email (Brevo)",
      text: "If you received this, Brevo SMTP works perfectly on Render!",
    });
    res.send("✅ Test email sent successfully");
  } catch (err) {
    res.status(500).send("❌ Email failed: " + err);
  }
});



startServer();
