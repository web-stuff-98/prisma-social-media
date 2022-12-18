/*
  Warnings:

  - Added the required column `description` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "description" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PrivateMessage" ADD COLUMN     "attachmentError" BOOLEAN,
ADD COLUMN     "attachmentPending" BOOLEAN;
