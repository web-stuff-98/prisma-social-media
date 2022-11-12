/*
  Warnings:

  - You are about to drop the column `userId` on the `PrivateMessage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PrivateMessage" DROP CONSTRAINT "PrivateMessage_userId_fkey";

-- AlterTable
ALTER TABLE "PrivateMessage" DROP COLUMN "userId",
ADD COLUMN     "attachmentKey" TEXT;
