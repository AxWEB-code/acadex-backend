/*
  Warnings:

  - The primary key for the `Exam` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `className` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `examYear` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `semester` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `timer` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Exam` table. All the data in the column will be lost.
  - The primary key for the `ExamQuestion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `correctOption` on the `ExamQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `ExamQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `questionImage` on the `ExamQuestion` table. All the data in the column will be lost.
  - The primary key for the `_ExamToStudent` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `ExamCourse` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExamOption` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[examCode]` on the table `Exam` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdById` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `examCode` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `examTitle` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mode` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionYear` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `questionType` on the `ExamQuestion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ExamMode" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('PENDING', 'APPROVED', 'LIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('OBJECTIVE', 'THEORY', 'PRACTICAL');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- DropForeignKey
ALTER TABLE "public"."ExamCourse" DROP CONSTRAINT "ExamCourse_examId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ExamOption" DROP CONSTRAINT "ExamOption_questionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ExamQuestion" DROP CONSTRAINT "ExamQuestion_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ExamQuestion" DROP CONSTRAINT "ExamQuestion_examId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Result" DROP CONSTRAINT "Result_examId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ResultAccessCode" DROP CONSTRAINT "ResultAccessCode_examId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_ExamToStudent" DROP CONSTRAINT "_ExamToStudent_A_fkey";

-- AlterTable
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_pkey",
DROP COLUMN "className",
DROP COLUMN "department",
DROP COLUMN "examYear",
DROP COLUMN "semester",
DROP COLUMN "timer",
DROP COLUMN "title",
DROP COLUMN "type",
ADD COLUMN     "classId" TEXT,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "examCode" TEXT NOT NULL,
ADD COLUMN     "examTitle" TEXT NOT NULL,
ADD COLUMN     "examTypes" "ExamType"[],
ADD COLUMN     "isResit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "levelId" TEXT,
ADD COLUMN     "linkedExamId" TEXT,
ADD COLUMN     "mode" "ExamMode" NOT NULL,
ADD COLUMN     "sessionYear" TEXT NOT NULL,
ADD COLUMN     "status" "ExamStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Exam_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Exam_id_seq";

-- AlterTable
ALTER TABLE "ExamQuestion" DROP CONSTRAINT "ExamQuestion_pkey",
DROP COLUMN "correctOption",
DROP COLUMN "question",
DROP COLUMN "questionImage",
ADD COLUMN     "correctAnswer" TEXT,
ADD COLUMN     "marks" INTEGER,
ADD COLUMN     "questionFile" TEXT,
ADD COLUMN     "questionText" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "examId" SET DATA TYPE TEXT,
ALTER COLUMN "courseId" SET DATA TYPE TEXT,
DROP COLUMN "questionType",
ADD COLUMN     "questionType" "ExamType" NOT NULL,
ADD CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ExamQuestion_id_seq";

-- AlterTable
ALTER TABLE "Result" ALTER COLUMN "examId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ResultAccessCode" ALTER COLUMN "examId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_ExamToStudent" DROP CONSTRAINT "_ExamToStudent_AB_pkey",
ALTER COLUMN "A" SET DATA TYPE TEXT,
ADD CONSTRAINT "_ExamToStudent_AB_pkey" PRIMARY KEY ("A", "B");

-- DropTable
DROP TABLE "public"."ExamCourse";

-- DropTable
DROP TABLE "public"."ExamOption";

-- DropEnum
DROP TYPE "public"."OptionLetter";

-- DropEnum
DROP TYPE "public"."QuestionType";

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamResult" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "courseId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "status" "ResultStatus" NOT NULL DEFAULT 'PENDING',
    "isResit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamNotification" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exam_examCode_key" ON "Exam"("examCode");

-- CreateIndex
CREATE INDEX "Exam_examCode_idx" ON "Exam"("examCode");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamNotification" ADD CONSTRAINT "ExamNotification_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultAccessCode" ADD CONSTRAINT "ResultAccessCode_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExamToStudent" ADD CONSTRAINT "_ExamToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
