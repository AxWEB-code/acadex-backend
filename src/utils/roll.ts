// src/utils/roll.ts
import prisma from "../prisma";

/**
 * Generate a global roll number (year-based + auto increment)
 * Example: adx-2025-001
 */
export async function generateRollNumber() {
  const year = new Date().getFullYear();

  // Count only students created this year (resets yearly)
  const countThisYear = await prisma.student.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
      },
    },
  });

  const next = countThisYear + 1;
  const serial = String(next).padStart(3, "0");

  return `adx-${year}-${serial}`;
}
