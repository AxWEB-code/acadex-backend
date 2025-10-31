import prisma from "../prisma";

/**
 * Generates a unique, sequential global roll number for students.
 * Format: ADX-001, ADX-002, ADX-003, ...
 */
export async function generateSequentialRollNumber(): Promise<string> {
  // Find the most recently created student (highest ID)
  const lastStudent = await prisma.student.findFirst({
    orderBy: { id: "desc" },
    select: { rollNumber: true },
  });

  let nextNumber = 1;

  if (lastStudent && lastStudent.rollNumber) {
    // Extract the numeric portion from something like "ADX-005"
    const match = lastStudent.rollNumber.match(/ADX-(\d+)/);
    if (match && match[1]) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Pad to at least 3 digits (001, 002, 099, 1000, etc.)
  const formatted = String(nextNumber).padStart(3, "0");
  return `ADX-${formatted}`;
}
