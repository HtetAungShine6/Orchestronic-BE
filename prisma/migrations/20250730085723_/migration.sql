/*
  Warnings:

  - A unique constraint covering the columns `[ownerId,displayCode]` on the table `Request` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Request_ownerId_displayCode_key" ON "public"."Request"("ownerId", "displayCode");
