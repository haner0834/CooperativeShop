-- DropForeignKey
ALTER TABLE "public"."FileRecord" DROP CONSTRAINT "FileRecord_userId_fkey";

-- AlterTable
ALTER TABLE "public"."FileRecord" ALTER COLUMN "thumbnailUrl" DROP NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."FileRecord" ADD CONSTRAINT "FileRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
