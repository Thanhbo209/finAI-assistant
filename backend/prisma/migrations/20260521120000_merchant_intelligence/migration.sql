-- CreateEnum
CREATE TYPE "CorrectionField" AS ENUM ('MERCHANT', 'CATEGORY');

-- AlterTable
ALTER TABLE "transactions"
ADD COLUMN "merchantId" TEXT,
ADD COLUMN "parserAmount" DECIMAL(19,4),
ADD COLUMN "parserCurrency" TEXT,
ADD COLUMN "parserMerchantName" TEXT,
ADD COLUMN "parserCategory" "TransactionCategory",
ADD COLUMN "parserMissingFields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "categoryTendencies" JSONB NOT NULL DEFAULT '{}',
    "recurringLikelihood" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_aliases" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "source" TEXT NOT NULL DEFAULT 'SYSTEM',
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_merchant_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "preferredCategory" "TransactionCategory" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "correctionCount" INTEGER NOT NULL DEFAULT 1,
    "lastCorrectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_merchant_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_corrections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "merchantId" TEXT,
    "field" "CorrectionField" NOT NULL,
    "parserMerchantName" TEXT,
    "finalMerchantName" TEXT,
    "parserCategory" "TransactionCategory",
    "finalCategory" "TransactionCategory",
    "confidenceBefore" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'HUMAN_CONFIRMATION',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smart_rules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT,
    "merchantNamePattern" TEXT,
    "normalizedMerchantName" TEXT,
    "category" "TransactionCategory" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smart_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscription_insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT,
    "merchantName" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "estimatedMonthlyCost" DECIMAL(19,4) NOT NULL,
    "nextExpectedCharge" TIMESTAMP(3) NOT NULL,
    "recurrenceConfidence" DOUBLE PRECISION NOT NULL,
    "cadenceDays" INTEGER NOT NULL,
    "transactionCount" INTEGER NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscription_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchants_normalizedName_key" ON "merchants"("normalizedName");
CREATE INDEX "merchants_canonicalName_idx" ON "merchants"("canonicalName");
CREATE INDEX "merchants_recurringLikelihood_idx" ON "merchants"("recurringLikelihood");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_aliases_normalizedAlias_key" ON "merchant_aliases"("normalizedAlias");
CREATE INDEX "merchant_aliases_merchantId_idx" ON "merchant_aliases"("merchantId");
CREATE INDEX "merchant_aliases_normalizedAlias_idx" ON "merchant_aliases"("normalizedAlias");

-- CreateIndex
CREATE UNIQUE INDEX "user_merchant_preferences_userId_merchantId_key" ON "user_merchant_preferences"("userId", "merchantId");
CREATE INDEX "user_merchant_preferences_userId_preferredCategory_idx" ON "user_merchant_preferences"("userId", "preferredCategory");

-- CreateIndex
CREATE INDEX "transaction_corrections_userId_createdAt_idx" ON "transaction_corrections"("userId", "createdAt" DESC);
CREATE INDEX "transaction_corrections_merchantId_field_idx" ON "transaction_corrections"("merchantId", "field");
CREATE INDEX "transaction_corrections_transactionId_idx" ON "transaction_corrections"("transactionId");

-- CreateIndex
CREATE INDEX "smart_rules_userId_isActive_priority_idx" ON "smart_rules"("userId", "isActive", "priority");
CREATE INDEX "smart_rules_userId_normalizedMerchantName_idx" ON "smart_rules"("userId", "normalizedMerchantName");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscription_insights_userId_merchantId_currency_key" ON "user_subscription_insights"("userId", "merchantId", "currency");
CREATE INDEX "user_subscription_insights_userId_recurrenceConfidence_idx" ON "user_subscription_insights"("userId", "recurrenceConfidence");
CREATE INDEX "user_subscription_insights_userId_nextExpectedCharge_idx" ON "user_subscription_insights"("userId", "nextExpectedCharge");

-- CreateIndex
CREATE INDEX "transactions_userId_merchantId_transactionDate_idx" ON "transactions"("userId", "merchantId", "transactionDate" DESC);

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "merchant_aliases" ADD CONSTRAINT "merchant_aliases_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_merchant_preferences" ADD CONSTRAINT "user_merchant_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_merchant_preferences" ADD CONSTRAINT "user_merchant_preferences_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transaction_corrections" ADD CONSTRAINT "transaction_corrections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transaction_corrections" ADD CONSTRAINT "transaction_corrections_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transaction_corrections" ADD CONSTRAINT "transaction_corrections_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "smart_rules" ADD CONSTRAINT "smart_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "smart_rules" ADD CONSTRAINT "smart_rules_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_subscription_insights" ADD CONSTRAINT "user_subscription_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_subscription_insights" ADD CONSTRAINT "user_subscription_insights_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
