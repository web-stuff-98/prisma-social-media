/*
  Warnings:

  - You are about to drop the `FriendshipOffer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FriendshipOffer" DROP CONSTRAINT "FriendshipOffer_recipientId_fkey";

-- DropTable
DROP TABLE "FriendshipOffer";

-- CreateTable
CREATE TABLE "Friendship" (
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "denied" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("senderId","recipientId")
);

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
