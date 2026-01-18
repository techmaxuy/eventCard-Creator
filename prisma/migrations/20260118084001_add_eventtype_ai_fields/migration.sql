-- AlterTable
ALTER TABLE "EventType" ADD COLUMN     "aiBackgroundPromptEn" TEXT,
ADD COLUMN     "aiBackgroundPromptEs" TEXT,
ADD COLUMN     "aiPhotoPromptEn" TEXT,
ADD COLUMN     "aiPhotoPromptEs" TEXT,
ADD COLUMN     "aiPhrasePromptEn" TEXT,
ADD COLUMN     "aiPhrasePromptEs" TEXT,
ADD COLUMN     "aiTitlePromptEn" TEXT,
ADD COLUMN     "aiTitlePromptEs" TEXT,
ADD COLUMN     "askNames" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "numberOfPeople" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "hasAIAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxEvents" INTEGER NOT NULL DEFAULT -1;

-- CreateTable
CREATE TABLE "EventAISettings" (
    "id" TEXT NOT NULL,
    "phraseGenerationCost" INTEGER NOT NULL DEFAULT 1,
    "imageEditCost" INTEGER NOT NULL DEFAULT 5,
    "imageGenerationCost" INTEGER NOT NULL DEFAULT 10,
    "descriptionGenerationCost" INTEGER NOT NULL DEFAULT 1,
    "suggestionsCost" INTEGER NOT NULL DEFAULT 1,
    "isAIEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventAISettings_pkey" PRIMARY KEY ("id")
);
