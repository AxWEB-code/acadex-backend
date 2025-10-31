import { Request, Response } from "express";
import prisma from "../prisma";
import { defaultSettings, defaultPermissions, adminRoles } from "../config/schoolDefaults";


// ✅ Helper function to generate random code/password
const generateRandomCode = (prefix: string, subdomain: string) => {
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${subdomain.toUpperCase()}-${random}`;
};

// ✅ Create School (single or bulk + departments)
export const createSchool = async (req: Request, res: Response) => {
  try {
    // 🧠 Detect if bulk create (array)
    if (Array.isArray(req.body)) {
      const results = [];

      for (const schoolData of req.body) {
        const {
          name,
          subdomain,
          logo,
          schoolType,
          plan,
          status,
          adminEmail,
          adminPassword,
          departments,
        } = schoolData;

        if (!name || !subdomain) continue;

        const existing = await prisma.school.findUnique({ where: { subdomain } });
        if (existing) continue;

        const schoolCode = `SCH-${subdomain.toUpperCase()}-${Math.floor(
          Math.random() * 9000 + 1000
        )}`;

        const created = await prisma.school.create({
          data: {
            name,
            subdomain,
            logo,
            schoolType: schoolType || "CBT",
            plan: plan || "free",
            status: status || "active",
            schoolCode,
            adminEmail,
            adminPassword,
            settings: defaultSettings,
            permissions: defaultPermissions,
            adminRoles: adminRoles(subdomain),
            analytics: {
              total_students: 0,
              total_exams: 0,
              total_results: 0,
              recent_activity: [],
            },
            // ✅ Automatically create departments
            departments: {
              create: departments || [],
            },
          },
          include: {
            departments: true,
          },
        });

        results.push(created);
      }

      return res.status(201).json({
        message: `✅ ${results.length} schools created successfully with departments`,
        results,
      });
    }

    // 🧩 Single School Creation (with optional departments)
    const {
      name,
      subdomain,
      logo,
      schoolType,
      plan,
      status,
      adminEmail,
      adminPassword,
      departments,
    } = req.body;

    if (!name || !subdomain) {
      return res.status(400).json({ error: "Name and subdomain are required" });
    }

    const existingSchool = await prisma.school.findUnique({ where: { subdomain } });
    if (existingSchool) {
      return res.status(400).json({ error: "Subdomain already exists" });
    }

    const schoolCode = `SCH-${subdomain.toUpperCase()}-${Math.floor(
      Math.random() * 9000 + 1000
    )}`;

    const school = await prisma.school.create({
      data: {
        name,
        subdomain,
        logo,
        schoolType: schoolType || "CBT",
        plan: plan || "free",
        status: status || "active",
        schoolCode,
        adminEmail,
        adminPassword,
        settings: defaultSettings,
        permissions: defaultPermissions,
        adminRoles: adminRoles(subdomain),
        analytics: {
          total_students: 0,
          total_exams: 0,
          total_results: 0,
          recent_activity: [],
        },
        departments: {
          create: departments || [],
        },
      },
      include: {
        departments: true,
      },
    });

    res.status(201).json({
      message: "✅ School created successfully with departments",
      school,
    });
  } catch (error: any) {
    console.error("❌ Error creating school:", error);

    if (error.code === "P1001")
      return res.status(500).json({ error: "Cannot connect to database server" });
    if (error.code === "P1012")
      return res.status(500).json({ error: "Schema validation error" });

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

// ✅ Verify School Code
// ✅ Verify School Code
export const verifySchoolCode = async (req: Request, res: Response) => {
  try {
    const { schoolCode, schoolId } = req.body;

    console.log("🔍 [BACKEND] Verification request:", { schoolCode, schoolId });

    if (!schoolCode || !schoolId) {
      console.log("❌ [BACKEND] Missing schoolCode or schoolId");
      return res.status(400).json({ 
        error: "School code and school ID are required" 
      });
    }

    // Find school by ID and verify the code
    const school = await prisma.school.findFirst({
      where: {
        id: Number(schoolId),
        schoolCode: schoolCode.trim().toUpperCase(),
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        schoolCode: true,
      },
    });

    console.log("🔍 [BACKEND] Found school:", school);

    if (school) {
      console.log("✅ [BACKEND] Code is VALID for school:", school.name);
      return res.status(200).json({ 
        isValid: true,
        school: {
          id: school.id,
          name: school.name,
          subdomain: school.subdomain,
        }
      });
    } else {
      console.log("❌ [BACKEND] Code is INVALID - no matching school found");
      return res.status(200).json({ 
        isValid: false 
      });
    }
  } catch (error: any) {
    console.error("❌ [BACKEND] Error verifying school code:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Debug: Get all schools with their codes
export const debugSchoolCodes = async (req: Request, res: Response) => {
  try {
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        schoolCode: true,
      },
    });
    
    console.log("🏫 [BACKEND] All school codes:", schools);
    res.json(schools);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};