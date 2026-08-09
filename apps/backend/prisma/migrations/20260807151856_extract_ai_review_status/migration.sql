/*
  Warnings:

  - The values [PROCESSING,AI_REJECT,AI_APPROVED] on the enum `ReviewStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "AiReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "ReviewStatus_new" AS ENUM ('IDLE', 'REJECT', 'SUCCESS', 'SUPERSEDED');
ALTER TABLE "ShopDraftVersion" ALTER COLUMN "reviewStatus" TYPE "ReviewStatus_new" USING ("reviewStatus"::text::"ReviewStatus_new");
ALTER TYPE "ReviewStatus" RENAME TO "ReviewStatus_old";
ALTER TYPE "ReviewStatus_new" RENAME TO "ReviewStatus";
DROP TYPE "public"."ReviewStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "ShopDraftVersion" ADD COLUMN     "aiReviewStatus" "AiReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "aiReviewedAt" TIMESTAMP(3),
ALTER COLUMN "reviewStatus" SET DEFAULT 'IDLE';
