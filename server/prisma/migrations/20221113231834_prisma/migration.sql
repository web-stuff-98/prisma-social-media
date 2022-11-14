-- CreateTable
CREATE TABLE "Pfp" (
    "base64" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Pfp_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "Pfp" ADD CONSTRAINT "Pfp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
