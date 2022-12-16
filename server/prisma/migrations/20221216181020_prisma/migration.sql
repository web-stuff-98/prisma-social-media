-- DropIndex
DROP INDEX "Pfp_base64_idx";

-- AlterTable
ALTER TABLE "PrivateMessage" ADD COLUMN     "readByRecipient" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RoomImage" (
    "roomId" TEXT NOT NULL,
    "base64" TEXT NOT NULL,

    CONSTRAINT "RoomImage_pkey" PRIMARY KEY ("roomId")
);

-- AddForeignKey
ALTER TABLE "RoomImage" ADD CONSTRAINT "RoomImage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
