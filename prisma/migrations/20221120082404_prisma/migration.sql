-- DropIndex
DROP INDEX "RoomMessage_senderId_idx";

-- AlterTable
ALTER TABLE "RoomMessage" ALTER COLUMN "senderId" DROP NOT NULL;
