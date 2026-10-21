-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PhoneVerification" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "telegramId" TEXT,
    "codeHash" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramPhone" (
    "telegramId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "username" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramPhone_pkey" PRIMARY KEY ("telegramId")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhoneVerification_token_key" ON "PhoneVerification"("token");

-- CreateIndex
CREATE INDEX "PhoneVerification_phone_createdAt_idx" ON "PhoneVerification"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "PhoneVerification_telegramId_createdAt_idx" ON "PhoneVerification"("telegramId", "createdAt");

-- CreateIndex
CREATE INDEX "TelegramPhone_phone_idx" ON "TelegramPhone"("phone");
