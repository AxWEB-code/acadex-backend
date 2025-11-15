import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const schoolId = Number(params.id);

    if (isNaN(schoolId)) {
      return NextResponse.json(
        { error: "Invalid school ID" },
        { status: 400 }
      );
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        students: true,
        exams: true,
        examResults: true,
        admins: true,
      },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(school);
  } catch (err) {
    console.error("Error fetching school:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
