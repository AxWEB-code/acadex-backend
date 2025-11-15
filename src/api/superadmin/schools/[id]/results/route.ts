import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const schoolId = Number(params.id);

    if (!schoolId || isNaN(schoolId)) {
      return NextResponse.json({ error: "Invalid school id" }, { status: 400 });
    }

    const results = await prisma.examResult.findMany({
      where: { schoolId },
      include: {
        student: {
          select: {
            admissionNo: true,
            rollNumber: true,
          },
        },
        exam: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.error("RESULTS ERROR:", err);
    return NextResponse.json(
      { error: "Unable to load results" },
      { status: 500 }
    );
  }
}
