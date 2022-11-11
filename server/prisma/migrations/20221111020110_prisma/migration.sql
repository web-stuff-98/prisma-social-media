/*
  Warnings:

  - You are about to drop the column `receiverId` on the `PrivateMessage` table. All the data in the column will be lost.
  - Added the required column `recipientId` to the `PrivateMessage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PrivateMessage" DROP CONSTRAINT "PrivateMessage_receiverId_fkey";

-- AlterTable
ALTER TABLE "PrivateMessage" DROP COLUMN "receiverId",
ADD COLUMN     "recipientId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PrivateMessage" ADD CONSTRAINT "PrivateMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
