-- CreateEnum
CREATE TYPE "PersonalAssetKind" AS ENUM ('photo', 'resume');

-- CreateTable
CREATE TABLE "PersonalProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "linkedinUrl" TEXT,
    "companyUrl" TEXT,
    "headline" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalSnippet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalSnippet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "PersonalAssetKind" NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonalProfile_userId_key" ON "PersonalProfile"("userId");

-- CreateIndex
CREATE INDEX "PersonalLink_userId_sortOrder_idx" ON "PersonalLink"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "PersonalSnippet_userId_sortOrder_idx" ON "PersonalSnippet"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "PersonalAsset_userId_idx" ON "PersonalAsset"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalAsset_userId_kind_key" ON "PersonalAsset"("userId", "kind");

-- AddForeignKey
ALTER TABLE "PersonalProfile" ADD CONSTRAINT "PersonalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalLink" ADD CONSTRAINT "PersonalLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalSnippet" ADD CONSTRAINT "PersonalSnippet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalAsset" ADD CONSTRAINT "PersonalAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
