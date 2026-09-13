-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AgeRange" AS ENUM ('UNDER_18', 'AGE_18_25', 'AGE_26_40', 'AGE_41_60', 'AGE_60_PLUS');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('PENDING', 'ANSWERED');

-- CreateTable
CREATE TABLE "Priest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Priest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriestInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "PriestInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLinkToken" (
    "id" TEXT NOT NULL,
    "priestId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "MagicLinkToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriestSession" (
    "id" TEXT NOT NULL,
    "priestId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "PriestSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "originalQuestionText" TEXT NOT NULL,
    "askerEmail" TEXT NOT NULL,
    "ageRange" "AgeRange" NOT NULL,
    "categoryId" TEXT,
    "aiSuggestedCategoryLabel" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "status" "QuestionStatus" NOT NULL DEFAULT 'PENDING',
    "answerText" TEXT,
    "answeredByPriestId" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Priest_email_key" ON "Priest"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PriestInvite_tokenHash_key" ON "PriestInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "PriestInvite_email_idx" ON "PriestInvite"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLinkToken_tokenHash_key" ON "MagicLinkToken"("tokenHash");

-- CreateIndex
CREATE INDEX "MagicLinkToken_priestId_idx" ON "MagicLinkToken"("priestId");

-- CreateIndex
CREATE UNIQUE INDEX "PriestSession_tokenHash_key" ON "PriestSession"("tokenHash");

-- CreateIndex
CREATE INDEX "PriestSession_priestId_idx" ON "PriestSession"("priestId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Question_status_isPublic_idx" ON "Question"("status", "isPublic");

-- CreateIndex
CREATE INDEX "Question_categoryId_idx" ON "Question"("categoryId");

-- AddForeignKey
ALTER TABLE "PriestInvite" ADD CONSTRAINT "PriestInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "Priest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicLinkToken" ADD CONSTRAINT "MagicLinkToken_priestId_fkey" FOREIGN KEY ("priestId") REFERENCES "Priest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriestSession" ADD CONSTRAINT "PriestSession_priestId_fkey" FOREIGN KEY ("priestId") REFERENCES "Priest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_answeredByPriestId_fkey" FOREIGN KEY ("answeredByPriestId") REFERENCES "Priest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Full-text search: generated tsvector over question + answer text, not modeled
-- natively by Prisma (schema.prisma has no tsvector type), so it's hand-added here.
-- Category filtering is a separate equality filter in application queries, not folded in.
ALTER TABLE "Question" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("questionText", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("answerText", '')), 'B')
  ) STORED;

CREATE INDEX "Question_searchVector_idx" ON "Question" USING GIN ("searchVector");

