-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "number" SERIAL NOT NULL;

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Banner_active_sort_idx" ON "Banner"("active", "sort");

-- CreateIndex
CREATE UNIQUE INDEX "Job_number_key" ON "Job"("number");


-- Ochiq vakansiya raqamlari 1001 dan boshlanadi (mavjud vakansiyalar ham shu tartibda raqamlanadi)
UPDATE "Job" SET "number" = "number" + 1000;
SELECT setval(pg_get_serial_sequence('"Job"', 'number'), GREATEST(1000, (SELECT COALESCE(MAX("number"), 1000) FROM "Job")));
