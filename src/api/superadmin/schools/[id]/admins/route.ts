import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const schoolId = Number(params.id);

    if (!schoolId || isNaN(schoolId)) {
      return NextResponse.json({ error: "Invalid school id" }, { status: 400 });
    }

    const admins = await prisma.admin.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLogin: true,
      },
    });

    return NextResponse.json({ admins });
  } catch (err) {
    console.error("ADMINS ERROR:", err);
    return NextResponse.json(
      { error: "Unable to load admins" },
      { status: 500 }
    );
  }
}
