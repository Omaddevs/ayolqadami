-- CreateEnum
CREATE TYPE "ContactKind" AS ENUM ('CALL', 'TELEGRAM', 'MESSAGE');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "calls" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "writes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "JobContact" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "kind" "ContactKind" NOT NULL,
    "viewer" TEXT NOT NULL,
    "userId" TEXT,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobContact_jobId_kind_createdAt_idx" ON "JobContact"("jobId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "JobContact_viewer_jobId_kind_createdAt_idx" ON "JobContact"("viewer", "jobId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "JobContact_createdAt_idx" ON "JobContact"("createdAt");

-- AddForeignKey
ALTER TABLE "JobContact" ADD CONSTRAINT "JobContact_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobContact" ADD CONSTRAINT "JobContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
