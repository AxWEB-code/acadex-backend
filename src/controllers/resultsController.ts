import { Request, Response } from "express";
import prisma from "../../prisma/client";  // if controller is inside src/controllers



export const getStudentResult = async (req: Request, res: Response) => {
  try {
    const { admissionNo, rollNumber, resultType, semester, examYear, accessCode } = req.body;

   // Verify access code
const codeEntry = await prisma.resultAccessCode.findFirst({
  where: {
    code: accessCode,
    student: { admissionNo }, // <- corrected
   },
 });


    if (!codeEntry) return res.status(400).json({ error: "Invalid code" });
    if (codeEntry.usedCount >= codeEntry.maxUses) return res.status(400).json({ error: "Code already used 3 times" });

    // 2. Fetch the exact result row
    const result = await prisma.result.findFirst({
      where: {
        admission_no: admissionNo,
        roll_number: rollNumber,
        result_type: resultType,
        semester,
        exam_year: examYear,
      },
    });

    if (!result) return res.status(404).json({ error: "Result not found" });

    // 3. Increment code usage
    await prisma.resultAccessCode.update({
      where: { id: codeEntry.id },
      data: { usedCount: codeEntry.usedCount + 1 },
    });

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};
