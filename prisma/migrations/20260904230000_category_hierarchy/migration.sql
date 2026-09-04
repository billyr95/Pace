-- DropIndex
DROP INDEX "Category_userId_name_key";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "parentId" TEXT,
ALTER COLUMN "icon" SET DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Category_userId_parentId_name_key" ON "Category"("userId", "parentId", "name");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

