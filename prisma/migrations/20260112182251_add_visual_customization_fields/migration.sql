-- AlterEnum
ALTER TYPE "AssetType" ADD VALUE 'DECORATION';

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "decorationPosition" TEXT,
ADD COLUMN     "decorationType" TEXT,
ADD COLUMN     "decorationUrl" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "decorations" JSONB,
ADD COLUMN     "fontFamily" TEXT;

-- AlterTable
ALTER TABLE "EventType" ADD COLUMN     "hideGuestCount" BOOLEAN NOT NULL DEFAULT false;
