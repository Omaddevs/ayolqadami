-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT 'briefcase',
    "parentId" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_sort_idx" ON "Category"("parentId", "sort");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "subcategory" TEXT;

-- CreateIndex
CREATE INDEX "Job_category_subcategory_idx" ON "Job"("category", "subcategory");

-- Dastlabki sohalar: web ilovadagi ro'yxat (src/data/mock.js) bilan bir xil slug, nom va ikonka — eski vakansiyalar o'zgarmaydi
INSERT INTO "Category" ("id", "slug", "name", "short", "icon", "sort", "updatedAt") VALUES
    ('cat_office', 'office', 'Ofis ishlari', 'Ofis', 'folder', 10, CURRENT_TIMESTAMP),
    ('cat_edu', 'edu', 'Ta''lim va pedagogika', 'Ta''lim', 'gradcap', 20, CURRENT_TIMESTAMP),
    ('cat_med', 'med', 'Tibbiyot va sog''liqni saqlash', 'Tibbiyot', 'stethoscope', 30, CURRENT_TIMESTAMP),
    ('cat_nanny', 'nanny', 'Enaga va bola parvarishi', 'Enaga', 'bottle', 40, CURRENT_TIMESTAMP),
    ('cat_housekeeper', 'housekeeper', 'Uy xizmatchisi', 'Uy xizmatchisi', 'house', 50, CURRENT_TIMESTAMP),
    ('cat_cleaning', 'cleaning', 'Tozalik xodimi', 'Tozalik', 'spray', 60, CURRENT_TIMESTAMP),
    ('cat_cook', 'cook', 'Oshpaz (uy va oshxona)', 'Oshpaz', 'pot', 70, CURRENT_TIMESTAMP),
    ('cat_caregiver', 'caregiver', 'Keksalar va bemorlar parvarishi', 'Parvarishchi', 'heart', 80, CURRENT_TIMESTAMP),
    ('cat_sales', 'sales', 'Savdo va mijozlar bilan ishlash', 'Savdo', 'bag', 90, CURRENT_TIMESTAMP),
    ('cat_beauty', 'beauty', 'Go''zallik va parvarish', 'Go''zallik', 'lipstick', 100, CURRENT_TIMESTAMP),
    ('cat_it', 'it', 'IT va dizayn', 'IT va dizayn', 'laptop', 110, CURRENT_TIMESTAMP),
    ('cat_home', 'home', 'Maishiy xizmatlar', 'Maishiy xizmat', 'building', 120, CURRENT_TIMESTAMP),
    ('cat_remote', 'remote', 'Masofaviy ish', 'Masofaviy', 'woman', 130, CURRENT_TIMESTAMP),
    ('cat_production', 'production', 'Ishlab chiqarish', 'Ishlab chiqarish', 'spool', 140, CURRENT_TIMESTAMP),
    ('cat_food', 'food', 'Restoran va mehmonxona', 'Restoran', 'cloche', 150, CURRENT_TIMESTAMP),
    ('cat_marketing', 'marketing', 'Marketing va media', 'Marketing', 'target', 160, CURRENT_TIMESTAMP),
    ('cat_finance', 'finance', 'Moliya va buxgalteriya', 'Moliya', 'coins', 170, CURRENT_TIMESTAMP),
    ('cat_law', 'law', 'Huquq va yuridik', 'Huquq', 'books', 180, CURRENT_TIMESTAMP),
    ('cat_logistics', 'logistics', 'Logistika va transport', 'Logistika', 'briefcase', 190, CURRENT_TIMESTAMP),
    ('cat_other', 'other', 'Boshqa toifalar', 'Boshqa', 'sparkle', 200, CURRENT_TIMESTAMP);

-- «IT va dizayn» bo'limlari (namuna — admin paneldan o'zgartiriladi)
INSERT INTO "Category" ("id", "slug", "name", "short", "icon", "parentId", "sort", "updatedAt") VALUES
    ('cat_it_frontend', 'frontend', 'Frontend', '', 'laptop', 'cat_it', 10, CURRENT_TIMESTAMP),
    ('cat_it_backend', 'backend', 'Backend', '', 'laptop', 'cat_it', 20, CURRENT_TIMESTAMP),
    ('cat_it_mobile', 'mobile', 'Mobil dasturlash', '', 'laptop', 'cat_it', 30, CURRENT_TIMESTAMP),
    ('cat_it_design', 'design', 'UI/UX dizayn', '', 'laptop', 'cat_it', 40, CURRENT_TIMESTAMP),
    ('cat_it_qa', 'qa', 'QA va testlash', '', 'laptop', 'cat_it', 50, CURRENT_TIMESTAMP);
