// src/controllers/departmentController.ts
import { Request, Response } from "express";
import prisma from "../prisma";

// ✅ Create Department
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, code, schoolId } = req.body;

    if (!name || !schoolId) {
      return res.status(400).json({ error: "Name and schoolId are required" });
    }

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: Number(schoolId) },
    });

    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    const department = await prisma.department.create({
      data: {
        name,
        code,
        schoolId: Number(schoolId),
      },
    });

    return res.status(201).json({
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    console.error("❌ Error creating department:", error);
    return res.status(500).json({ error: "Failed to create department" });
  }
};

// ✅ Get ALL Departments
export const getDepartments = async (_req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        school: true,
      },
    });

    return res.status(200).json(departments);
  } catch (error) {
    console.error("❌ Error fetching departments:", error);
    return res.status(500).json({ error: "Failed to fetch departments" });
  }
};

// ✅ (Optional) Get ONE Department by id — in case you need it later
// ✅ Get single department with students
export const getDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        students: true, // 👈 important so frontend gets dep.students[]
      },
    });

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    res.json(department);
  } catch (error: any) {
    console.error("❌ Error fetching department:", error);
    res.status(500).json({ error: error.message || "Failed to fetch department" });
  }
};


// ✅ Get Departments by School
export const getDepartmentsBySchool = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;

    const departments = await prisma.department.findMany({
      where: { schoolId: Number(schoolId) },
      include: {
        students: true,
        courses: true,
      },
    });

    return res.status(200).json(departments);
  } catch (error) {
    console.error("❌ Error fetching departments by school:", error);
    return res.status(500).json({ error: "Failed to fetch departments" });
  }
};

// ✅ Update Department
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const updated = await prisma.department.update({
      where: { id }, // id is String
      data: { name, code },
    });

    return res.status(200).json({
      message: "Department updated successfully",
      updated,
    });
  } catch (error) {
    console.error("❌ Error updating department:", error);
    return res.status(500).json({ error: "Failed to update department" });
  }
};

// ✅ Delete Department
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.department.delete({
      where: { id }, // id is String
    });

    return res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting department:", error);
    return res.status(500).json({ error: "Failed to delete department" });
  }
};

// ✅ Set Admission Format for a Department
export const setAdmissionFormat = async (req: Request, res: Response) => {
  try {
    const { departmentId, formatPreview } = req.body;

    if (!departmentId || !formatPreview) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Example: ECNS/AD/2024/001
    const prefix = formatPreview.split("/")[0]; // e.g. "ECNS"
    const regex = `^${prefix}\\/AD\\/\\d{4}\\/\\d{3}$`;

    const updated = await prisma.department.update({
      where: { id: departmentId },
      data: {
        admissionFormatPreview: formatPreview,
        admissionFormatRegex: regex,
      },
    });

    return res.json({
      message: "Admission format set successfully",
      department: updated,
    });
  } catch (error: any) {
    console.error("❌ Error setting admission format:", error);
    return res
      .status(500)
      .json({ message: "Error setting format", error: error.message });
  }
};
