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

    res.status(201).json({
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    console.error("❌ Error creating department:", error);
    res.status(500).json({ error: "Failed to create department" });
  }
};

// ✅ Get all Departments
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: { school: true },
    });
    res.status(200).json(departments);
  } catch (error) {
    console.error("❌ Error fetching departments:", error);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
};

// ✅ Get Departments by School
export const getDepartmentsBySchool = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const departments = await prisma.department.findMany({
      where: { schoolId: Number(schoolId) },
    });

    res.status(200).json(departments);
  } catch (error) {
    console.error("❌ Error fetching departments by school:", error);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
};

// ✅ Update Department
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const updated = await prisma.department.update({
      where: { id},  
      data: { name, code },
    });

    res.status(200).json({
      message: "Department updated successfully",
      updated,
    });
  } catch (error) {
    console.error("❌ Error updating department:", error);
    res.status(500).json({ error: "Failed to update department" });
  }
};

// ✅ Delete Department
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.department.delete({
     where: { id},  
    });

    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting department:", error);
    res.status(500).json({ error: "Failed to delete department" });
  }
};

// controllers/departmentController.ts

export const setAdmissionFormat = async (req: Request, res: Response) => {
  try {
    const { departmentId, formatPreview } = req.body;

    if (!departmentId || !formatPreview)
      return res.status(400).json({ message: "Missing required fields" });

    // Convert preview (ECNS/AD/2024/001) into regex
    const prefix = formatPreview.split("/")[0]; // e.g. ECNS
    const regex = `^${prefix}\\/AD\\/\\d{4}\\/\\d{3}$`;

    const updated = await prisma.department.update({
      where: { id: departmentId},
      data: {
        admissionFormatPreview: formatPreview,
        admissionFormatRegex: regex,
      },
    });

    res.json({
      message: "Admission format set successfully",
      department: updated,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error setting format", error: error.message });
  }
};
