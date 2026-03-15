-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "cookTime" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "nutrition" JSONB,
ADD COLUMN     "prepTime" INTEGER,
ADD COLUMN     "servings" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "subcategoryId" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "totalTime" INTEGER;

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_name_key" ON "Subcategory"("name");

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
