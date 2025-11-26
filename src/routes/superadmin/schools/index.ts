import { Router, Request } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import prisma from "../../../lib/prisma";

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

const router = Router();

// 🔹 Multer storage config
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: any) => {
    const uploadsDir = path.join(process.cwd(), "uploads");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    cb(null, uploadsDir);
  },

  filename: (req: Request, file: Express.Multer.File, cb: any) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const cleanName = file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueSuffix + "-" + cleanName);
  },
});

// 🔹 File filter
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: (error: any, acceptFile: boolean) => void
) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files allowed!"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

// 🔹 Generate school code
async function generateSchoolCode(name: string): Promise<string> {
  const prefix =
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 3) || "SCH";

  let code = "";
  let attempts = 0;

  while (attempts < 10) {
    const random = Math.floor(1000 + Math.random() * 9000);
    code = `${prefix}-${random}`;

    const exists = await prisma.school.findUnique({
      where: { schoolCode: code },
    });

    if (!exists) return code;
    attempts++;
  }

  return `SCH-${Date.now().toString().slice(-4)}`;
}

// 🔹 GET schools
router.get("/", async (req, res) => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        students: true,
        adminUsers: true,
      },
    });

    return res.json({
      success: true,
      schools: schools.map((s) => ({
        id: s.id,
        name: s.name,
        schoolCode: s.schoolCode,
        logo: s.logo,
        status: s.status,
        createdAt: s.createdAt,
        studentsCount: s.students.length,
        adminsCount: s.adminUsers.length,
      })),
    });
  } catch (err) {
    console.error("Failed to load schools:", err);
    return res.status(500).json({
      success: false,
      message: "Server error loading schools",
    });
  }
});

// 🔹 POST create school (with logo upload)
router.post("/", upload.single("logo"), async (req: Request & { file?: any }, res) => {
  try {
    const {
      name,
      subdomain,
      schoolType,
      adminEmail,
      adminPassword,
      plan,
    } = req.body;

    if (!name || !subdomain || !schoolType || !adminEmail || !adminPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, subdomain, schoolType, adminEmail, adminPassword",
      });
    }

    const cleanName = name.trim();
    const cleanSubdomain = subdomain.trim().toLowerCase();
    const cleanAdminEmail = adminEmail.trim().toLowerCase();
    const cleanPlan = (plan || "free").toLowerCase();

    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(cleanSubdomain)) {
      return res.status(400).json({
        success: false,
        message: "Subdomain can only contain lowercase letters, numbers, hyphens.",
      });
    }

    // Check subdomain existence
    const existingSubdomain = await prisma.school.findUnique({
      where: { subdomain: cleanSubdomain },
    });
    if (existingSubdomain) {
      return res.status(409).json({
        success: false,
        message: "Subdomain already exists.",
      });
    }

    // Check admin email
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: cleanAdminEmail },
    });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Admin with this email already exists.",
      });
    }

    const schoolCode = await generateSchoolCode(cleanName);
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    let logoPath = null;
    if (req.file) {
      logoPath = `/uploads/${req.file.filename}`;
    }

    // Create school + admin
    const school = await prisma.school.create({
      data: {
        name: cleanName,
        subdomain: cleanSubdomain,
        schoolCode,
        schoolType,
        logo: logoPath,
        status: "active",
        plan: cleanPlan,
        adminEmail: cleanAdminEmail,
        adminPassword: hashedPassword,
        adminUsers: {
          create: {
            firstName: "Main",
            lastName: "Admin",
            email: cleanAdminEmail,
            password: hashedPassword,
            role: "general-admin",
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "School created successfully",
      school,
    });
  } catch (error: any) {
  console.error("CREATE SCHOOL ERROR:", error);

  // Handle multer errors specifically
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 2MB.",
      });
    }
  }

    return res.status(500).json({
    success: false,
    message: "Server error creating school",
  });
}
});

import getOneSchool from "./getOne";
import studentsRoute from "./students";

router.use("/", getOneSchool);
router.use("/", studentsRoute);



export default router;

