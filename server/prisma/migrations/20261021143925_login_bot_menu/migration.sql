-- AlterTable
ALTER TABLE "TelegramPhone" ADD COLUMN     "lang" TEXT,
ADD COLUMN     "notifyLogin" BOOLEAN NOT NULL DEFAULT true;
