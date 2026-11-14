-- Sayt tashriflari (ichki statistika)
CREATE TABLE "PageView" (
    "id" BIGSERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "visitor" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "userId" TEXT,
    "country" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");
CREATE INDEX "PageView_path_createdAt_idx" ON "PageView"("path", "createdAt");
