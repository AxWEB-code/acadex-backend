/*
  Warnings:

  - You are about to drop the column `rejectionReason` on the `Student` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "School" ADD COLUMN     "status" TEXT DEFAULT 'active';

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "rejectionReason";
