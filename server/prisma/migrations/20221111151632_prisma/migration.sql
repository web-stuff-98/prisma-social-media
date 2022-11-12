-- CreateTable
CREATE TABLE "FriendshipOffer" (
    "recipientId" TEXT NOT NULL,

    CONSTRAINT "FriendshipOffer_pkey" PRIMARY KEY ("recipientId")
);

-- AddForeignKey
ALTER TABLE "FriendshipOffer" ADD CONSTRAINT "FriendshipOffer_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
