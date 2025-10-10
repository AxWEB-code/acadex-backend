/*
  Warnings:

  - You are about to drop the column `category` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[schoolCode]` on the table `School` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rollNumber]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `schoolCode` to the `School` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Made the column `rollNumber` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `approvalStatus` on table `Student` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "SchoolType" AS ENUM ('HIGH_SCHOOL', 'TERTIARY', 'CBT');

-- DropIndex
DROP INDEX "public"."Student_admissionNo_key";

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "adminEmail" TEXT,
ADD COLUMN     "adminPassword" TEXT,
ADD COLUMN     "adminRoles" JSONB,
ADD COLUMN     "analytics" JSONB,
ADD COLUMN     "permissions" JSONB,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN     "schoolCode" TEXT NOT NULL,
ADD COLUMN     "schoolType" "SchoolType" NOT NULL DEFAULT 'CBT',
ADD COLUMN     "settings" JSONB,
ADD COLUMN     "subscriptionEnd" TIMESTAMP(3),
ADD COLUMN     "subscriptionStart" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "category",
DROP COLUMN "department",
ADD COLUMN     "admissionFormatValid" BOOLEAN DEFAULT true,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "gender" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "level" TEXT,
ADD COLUMN     "loginAttempts" INTEGER DEFAULT 0,
ADD COLUMN     "performance" JSONB,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'student',
ADD COLUMN     "semester" TEXT,
ADD COLUMN     "subdomain" TEXT,
ADD COLUMN     "term" TEXT,
ALTER COLUMN "rollNumber" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending',
ALTER COLUMN "approvalStatus" SET NOT NULL;

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "schoolId" INTEGER NOT NULL,
    "admissionFormatRegex" TEXT,
    "admissionFormatPreview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "studentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ExamToStudent" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ExamToStudent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ExamToStudent_B_index" ON "_ExamToStudent"("B");

-- CreateIndex
CREATE UNIQUE INDEX "School_schoolCode_key" ON "School"("schoolCode");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNumber_key" ON "Student"("rollNumber");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExamToStudent" ADD CONSTRAINT "_ExamToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExamToStudent" ADD CONSTRAINT "_ExamToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
