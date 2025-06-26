/*
  Warnings:

  - The values [in progress,done,canceled] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `repository` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `team` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `userName` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `DB` on the `Resources` table. All the data in the column will be lost.
  - You are about to drop the column `ST` on the `Resources` table. All the data in the column will be lost.
  - You are about to drop the column `VM` on the `Resources` table. All the data in the column will be lost.
  - Added the required column `repositoryName` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Made the column `resourceGroup` on table `Request` required. This step will fail if there are existing NULL values in that column.
  - Made the column `region` on table `Request` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cloudProvider` on table `Request` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Request` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `Request` required. This step will fail if there are existing NULL values in that column.
  - Made the column `resourcesId` on table `Request` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `configId` to the `Resources` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Resources` table without a default value. This is not possible if the table is not empty.
  - Added the required column `repositoryId` to the `Resources` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('Pending', 'Approved', 'Rejected');
ALTER TABLE "Request" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Request" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
ALTER TABLE "Request" ALTER COLUMN "status" SET DEFAULT 'Pending';
COMMIT;

-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_resourcesId_fkey";

-- AlterTable
ALTER TABLE "Request" DROP COLUMN "repository",
DROP COLUMN "team",
DROP COLUMN "userName",
ADD COLUMN     "repositoryId" TEXT,
ADD COLUMN     "repositoryName" TEXT NOT NULL,
ALTER COLUMN "resourceGroup" SET NOT NULL,
ALTER COLUMN "region" SET NOT NULL,
ALTER COLUMN "cloudProvider" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'Pending',
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "resourcesId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Resources" DROP COLUMN "DB",
DROP COLUMN "ST",
DROP COLUMN "VM",
ADD COLUMN     "configId" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "repositoryId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceConfig" (
    "id" TEXT NOT NULL,
    "VM" INTEGER NOT NULL,
    "DB" INTEGER NOT NULL,
    "ST" INTEGER NOT NULL,

    CONSTRAINT "ResourceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRepository" (
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,

    CONSTRAINT "UserRepository_pkey" PRIMARY KEY ("userId","repositoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Repository_name_key" ON "Repository"("name");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_resourcesId_fkey" FOREIGN KEY ("resourcesId") REFERENCES "Resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resources" ADD CONSTRAINT "Resources_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ResourceConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resources" ADD CONSTRAINT "Resources_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRepository" ADD CONSTRAINT "UserRepository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRepository" ADD CONSTRAINT "UserRepository_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
