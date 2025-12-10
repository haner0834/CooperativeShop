/*
  Warnings:

  - You are about to drop the column `googleMapsLink` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailLink` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the `WorkSchedule` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `schedules` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnailKey` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."WorkSchedule" DROP CONSTRAINT "WorkSchedule_shopId_fkey";

-- AlterTable
ALTER TABLE "public"."Shop" DROP COLUMN "googleMapsLink",
DROP COLUMN "thumbnailLink",
ADD COLUMN     "schedules" JSONB NOT NULL,
ADD COLUMN     "subTitle" TEXT,
ADD COLUMN     "thumbnailKey" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."WorkSchedule";

-- DropEnum
DROP TYPE "public"."Weekday";
