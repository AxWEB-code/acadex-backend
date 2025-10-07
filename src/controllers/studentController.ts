import { Request, Response } from "express";
import prisma from "../prisma";

// Create Student
export const createStudent = async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.create({
      data: req.body,
    });
    res.status(201).json(student);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Get all students
export const getStudents = async (req: Request, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      include: { school: true, results: true },
    });
    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Get single student
export const getStudent = async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: Number(req.params.id) },
      include: { school: true, results: true },
    });
    if (!student) return res.status(404).json({ error: "Not found" });
    res.json(student);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Update student
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(student);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Delete student
export const deleteStudent = async (req: Request, res: Response) => {
  try {
    await prisma.student.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Student deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
