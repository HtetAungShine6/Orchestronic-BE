/*
  Warnings:

  - The values [Pending,Approved,Rejected] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `status` on table `Request` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('in progress', 'done', 'canceled');
ALTER TABLE "Request" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Request" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
ALTER TABLE "Request" ALTER COLUMN "status" SET DEFAULT 'in progress';
COMMIT;

-- AlterTable
ALTER TABLE "Request" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'in progress';
