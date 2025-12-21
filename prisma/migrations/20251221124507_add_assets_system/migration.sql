-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('IMAGE', 'AUDIO', 'PHRASE');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "eventTypeId" TEXT,
    "imageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "audioUrl" TEXT,
    "audioDuration" INTEGER,
    "phraseEs" TEXT,
    "phraseEn" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asset_type_eventTypeId_isActive_idx" ON "Asset"("type", "eventTypeId", "isActive");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
