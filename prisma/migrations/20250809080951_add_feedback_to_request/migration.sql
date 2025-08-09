-- AlterTable
ALTER TABLE "public"."Request" ADD COLUMN     "feedback" TEXT;

-- AddForeignKey
ALTER TABLE "public"."CloudResourceSecret" ADD CONSTRAINT "CloudResourceSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
