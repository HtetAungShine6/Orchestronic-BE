-- CreateEnum
CREATE TYPE "CloudProvider" AS ENUM ('AWS', 'AZURE');

-- CreateTable
CREATE TABLE "CloudResourceSecret" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT NOT NULL,
    "cloudProvider" "CloudProvider" NOT NULL,

    CONSTRAINT "CloudResourceSecret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CloudResourceSecret_clientId_key" ON "CloudResourceSecret"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "CloudResourceSecret_subscriptionId_key" ON "CloudResourceSecret"("subscriptionId");
