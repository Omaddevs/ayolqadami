-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');

-- AlterTable
ALTER TABLE "TelegramPost" ADD COLUMN     "adId" TEXT;

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "template" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "status" "AdStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "warnings" TEXT[],
    "tgUserId" TEXT NOT NULL,
    "tgUsername" TEXT,
    "authorName" TEXT NOT NULL,
    "authorPhone" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'uz',
    "jobId" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ad_number_key" ON "Ad"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Ad_jobId_key" ON "Ad"("jobId");

-- CreateIndex
CREATE INDEX "Ad_status_createdAt_idx" ON "Ad"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Ad_tgUserId_idx" ON "Ad"("tgUserId");

-- CreateIndex
CREATE INDEX "TelegramPost_adId_idx" ON "TelegramPost"("adId");

-- AddForeignKey
ALTER TABLE "TelegramPost" ADD CONSTRAINT "TelegramPost_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

