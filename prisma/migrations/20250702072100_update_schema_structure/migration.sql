/*
  Warnings:

  - You are about to drop the column `cloudProvider` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `repositoryName` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `resourceGroup` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `DB` on the `ResourceConfig` table. All the data in the column will be lost.
  - You are about to drop the column `ST` on the `ResourceConfig` table. All the data in the column will be lost.
  - You are about to drop the column `VM` on the `ResourceConfig` table. All the data in the column will be lost.
  - You are about to drop the column `configId` on the `Resources` table. All the data in the column will be lost.
  - You are about to drop the column `repositoryId` on the `Resources` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[resourcesId]` on the table `Repository` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ownerId]` on the table `Request` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[repositoryId]` on the table `Request` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resourceConfigId]` on the table `Resources` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `resourcesId` to the `Repository` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Made the column `repositoryId` on table `Request` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `cloudProvider` to the `Resources` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region` to the `Resources` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resourceConfigId` to the `Resources` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RepositoryStatus" AS ENUM ('Created', 'Pending');

-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_userId_fkey";

-- DropForeignKey
ALTER TABLE "Resources" DROP CONSTRAINT "Resources_configId_fkey";

-- DropForeignKey
ALTER TABLE "Resources" DROP CONSTRAINT "Resources_repositoryId_fkey";

-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "resourcesId" TEXT NOT NULL,
ADD COLUMN     "status" "RepositoryStatus" NOT NULL DEFAULT 'Pending',
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Request" DROP COLUMN "cloudProvider",
DROP COLUMN "date",
DROP COLUMN "region",
DROP COLUMN "repositoryName",
DROP COLUMN "resourceGroup",
DROP COLUMN "userId",
ADD COLUMN     "ownerId" TEXT NOT NULL,
ALTER COLUMN "repositoryId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ResourceConfig" DROP COLUMN "DB",
DROP COLUMN "ST",
DROP COLUMN "VM";

-- AlterTable
ALTER TABLE "Resources" DROP COLUMN "configId",
DROP COLUMN "repositoryId",
ADD COLUMN     "cloudProvider" TEXT NOT NULL,
ADD COLUMN     "region" TEXT NOT NULL,
ADD COLUMN     "resourceConfigId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "VMInstance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "numberOfCores" INTEGER NOT NULL,
    "memory" INTEGER NOT NULL,
    "os" TEXT NOT NULL,
    "resourceConfigId" TEXT NOT NULL,

    CONSTRAINT "VMInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatabaseInstance" (
    "id" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "storageGB" INTEGER NOT NULL,
    "resourceConfigId" TEXT NOT NULL,

    CONSTRAINT "DatabaseInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageInstance" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacityGB" INTEGER NOT NULL,
    "resourceConfigId" TEXT NOT NULL,

    CONSTRAINT "StorageInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RepositoryCollaborators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RepositoryCollaborators_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RepositoryCollaborators_B_index" ON "_RepositoryCollaborators"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_resourcesId_key" ON "Repository"("resourcesId");

-- CreateIndex
CREATE UNIQUE INDEX "Request_ownerId_key" ON "Request"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Request_repositoryId_key" ON "Request"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Resources_resourceConfigId_key" ON "Resources"("resourceConfigId");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_resourcesId_fkey" FOREIGN KEY ("resourcesId") REFERENCES "Resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resources" ADD CONSTRAINT "Resources_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "ResourceConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VMInstance" ADD CONSTRAINT "VMInstance_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "ResourceConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatabaseInstance" ADD CONSTRAINT "DatabaseInstance_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "ResourceConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageInstance" ADD CONSTRAINT "StorageInstance_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "ResourceConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RepositoryCollaborators" ADD CONSTRAINT "_RepositoryCollaborators_A_fkey" FOREIGN KEY ("A") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RepositoryCollaborators" ADD CONSTRAINT "_RepositoryCollaborators_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
