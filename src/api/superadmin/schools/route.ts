
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        students: true,
        admins: true,
      },
    });

    return NextResponse.json({
      success: true,
      schools: schools.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        logo: s.logo,
        status: s.status,
        createdAt: s.createdAt,
        studentsCount: s.students.length,
        adminsCount: s.admins.length,
        joined: s.createdAt,
      })),
    });
  } catch (error) {
    console.error("Failed to load schools:", error);
    return NextResponse.json(
      { success: false, message: "Server error loading schools" },
      { status: 500 }
    );
  }
}
