import { Request, Response } from "express";
import prisma from "../prisma";
import { defaultSettings, defaultPermissions, adminRoles } from "../config/schoolDefaults";


// ✅ Helper function to generate random code/password
const generateRandomCode = (prefix: string, subdomain: string) => {
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${subdomain.toUpperCase()}-${random}`;
};

// ✅ Create School
export const createSchool = async (req: Request, res: Response) => {
  try {
    const { name, subdomain, logo, schoolType } = req.body;

    // Validate required fields
    if (!name || !subdomain) {
      return res.status(400).json({ error: "Name and subdomain are required" });
    }

    // Check if subdomain already exists
    const existingSchool = await prisma.school.findUnique({
      where: { subdomain },
    });

    if (existingSchool) {
      return res.status(400).json({ error: "Subdomain already exists" });
    }

    // Generate unique school code
    const schoolCode = generateRandomCode("SCH", subdomain);
    const roles = adminRoles(subdomain);

    const analytics = {
      total_students: 0,
      total_exams: 0,
      total_results: 0,
      recent_activity: [],
    };

    const planData = {
      plan: "free",
      subscriptionStart: null,
      subscriptionEnd: null,
    };

    console.log("Creating school:", req.body);

    const school = await prisma.school.create({
      data: {
        name,
        subdomain,
        logo,
        schoolType: schoolType || "CBT",
        schoolCode,
        settings: defaultSettings,
        permissions: defaultPermissions,
        adminRoles: roles,
        analytics,
        ...planData,
      },
    });

    res.status(201).json({
      message: "✅ School created successfully with default configuration",
      school,
    });
  } catch (error: any) {
    console.error("❌ Error creating school:", error);
    
    // Handle specific Prisma errors
    if (error.code === 'P1001') {
      return res.status(500).json({ error: "Cannot connect to database server" });
    }
    if (error.code === 'P1012') {
      return res.status(500).json({ error: "Schema validation error" });
    }
    
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get All Schools
export const getSchools = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const schools = await prisma.school.findMany({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: { students: true, exams: true },
    });

    res.json(schools);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ Get Single School
export const getSchool = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const school = await prisma.school.findUnique({
      where: { id: Number(id) },
      include: { students: true, exams: true },
    });
    if (!school) return res.status(404).json({ error: "School not found" });
    res.json(school);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update School
export const updateSchool = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, subdomain, logo } = req.body;
    const school = await prisma.school.update({
      where: { id: Number(id) },
     data: {
  ...(name && { name }),
  ...(subdomain && { subdomain }),
  ...(logo && { logo }),
},

    });
    res.json(school);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete School
export const deleteSchool = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.school.delete({ where: { id: Number(id) } });
    res.json({ message: "School deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get School by Subdomain
export const getSchoolBySubdomain = async (req: Request, res: Response) => {
  try {
    const { subdomain } = req.params;
    const school = await prisma.school.findUnique({
      where: { subdomain },
      include: { students: true, exams: true },
    });

    if (!school) return res.status(404).json({ error: "School not found" });
    res.json(school);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

