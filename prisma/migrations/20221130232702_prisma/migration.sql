-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "blur" TEXT,
ADD COLUMN     "imagePending" BOOLEAN NOT NULL DEFAULT true;
