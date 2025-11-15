import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const schoolId = Number(params.id);

    if (!schoolId || isNaN(schoolId)) {
      return NextResponse.json({ error: "Invalid school id" }, { status: 400 });
    }

    const students = await prisma.student.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        admissionNo: true,
        rollNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        contactNumber: true,
        gender: true,
        class: true,
        level: true,
        department: {
          select: {
            name: true,
          },
        },
        status: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    // Format result for frontend table
    const mapped = students.map((s) => ({
      admissionNo: s.admissionNo,
      rollNo: s.rollNumber,
      name: s.firstName + " " + s.lastName,
      class: s.class || s.level || "—",
      department: s.department?.name || "—",
      gender: s.gender || "—",
      status: s.isActive ? "Active" : "Inactive",
      email: s.email,
      phone: s.contactNumber ?? "—",
      lastLogin: s.lastLogin ?? "—",
    }));

    return NextResponse.json({ students: mapped });
  } catch (error) {
    console.error("FETCH STUDENTS ERROR:", error);
    return NextResponse.json(
      { error: "Unable to fetch students" },
      { status: 500 }
    );
  }
}
