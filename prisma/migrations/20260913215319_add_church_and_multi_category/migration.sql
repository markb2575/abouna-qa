/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Question` table. All the data in the column will be lost.
  - Added the required column `church` to the `Priest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `Priest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Priest` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_categoryId_fkey";

-- DropIndex
DROP INDEX "Question_categoryId_idx";

-- DropIndex
DROP INDEX "Question_searchVector_idx";

-- AlterTable
ALTER TABLE "Priest" ADD COLUMN     "church" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL;

-- AlterTable
-- Note: the generated "searchVector" tsvector column is untouched here — it's
-- not a real Prisma-managed field, and Postgres rejects DROP DEFAULT on a
-- GENERATED column, which Prisma's diff engine doesn't know about.
ALTER TABLE "Question" DROP COLUMN "categoryId",
ADD COLUMN     "askerChurch" TEXT,
ADD COLUMN     "askerCountry" TEXT,
ADD COLUMN     "askerState" TEXT;

-- CreateTable
CREATE TABLE "QuestionCategory" (
    "questionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "QuestionCategory_pkey" PRIMARY KEY ("questionId","categoryId")
);

-- CreateIndex
CREATE INDEX "QuestionCategory_categoryId_idx" ON "QuestionCategory"("categoryId");

-- CreateIndex
CREATE INDEX "Priest_church_idx" ON "Priest"("church");

-- CreateIndex
CREATE INDEX "Question_askerChurch_idx" ON "Question"("askerChurch");

-- AddForeignKey
ALTER TABLE "QuestionCategory" ADD CONSTRAINT "QuestionCategory_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionCategory" ADD CONSTRAINT "QuestionCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
