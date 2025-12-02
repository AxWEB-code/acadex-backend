/*
  Warnings:

  - You are about to drop the `ExamQuestion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ExamQuestion" DROP CONSTRAINT "ExamQuestion_examId_fkey";

-- DropTable
DROP TABLE "public"."ExamQuestion";
