/*
  Warnings:

  - You are about to drop the column `readByRecipient` on the `PrivateMessage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PrivateMessage" DROP COLUMN "readByRecipient";
