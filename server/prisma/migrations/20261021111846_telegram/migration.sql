-- CreateEnum
CREATE TYPE "TelegramPostStatus" AS ENUM ('SENT', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('RUNNING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "TelegramUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "username" TEXT,
    "languageCode" TEXT,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramChannel" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "username" TEXT,
    "type" TEXT NOT NULL DEFAULT 'channel',
    "memberCount" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "autoPost" BOOLEAN NOT NULL DEFAULT true,
    "categories" TEXT[],
    "cities" TEXT[],
    "lastPostAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramPost" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "jobId" TEXT,
    "text" TEXT NOT NULL,
    "photo" TEXT,
    "messageId" INTEGER,
    "status" "TelegramPostStatus" NOT NULL,
    "error" TEXT,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramBroadcast" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "photo" TEXT,
    "buttonText" TEXT,
    "buttonUrl" TEXT,
    "total" INTEGER NOT NULL DEFAULT 0,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "status" "BroadcastStatus" NOT NULL DEFAULT 'RUNNING',
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "TelegramBroadcast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUser_userId_key" ON "TelegramUser"("userId");

-- CreateIndex
CREATE INDEX "TelegramUser_blocked_idx" ON "TelegramUser"("blocked");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramChannel_chatId_key" ON "TelegramChannel"("chatId");

-- CreateIndex
CREATE INDEX "TelegramPost_channelId_createdAt_idx" ON "TelegramPost"("channelId", "createdAt");

-- CreateIndex
CREATE INDEX "TelegramPost_jobId_idx" ON "TelegramPost"("jobId");

-- AddForeignKey
ALTER TABLE "TelegramUser" ADD CONSTRAINT "TelegramUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramPost" ADD CONSTRAINT "TelegramPost_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TelegramChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramPost" ADD CONSTRAINT "TelegramPost_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
