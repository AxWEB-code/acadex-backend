import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // make sure this exists

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const schoolId = Number(params.id);

    if (!schoolId || isNaN(schoolId)) {
      return NextResponse.json({ error: "Invalid school id" }, { status: 400 });
    }

    const exams = await prisma.exam.findMany({
      where: {
        schoolId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        department: true,
        createdBy: true,
      },
    });

    return NextResponse.json({ exams });
  } catch (error) {
    console.error("EXAMS API ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong fetching exams" },
      { status: 500 }
    );
  }
}
