-- CreateEnum
CREATE TYPE "public"."DeviceType" AS ENUM ('IPHONE', 'MAC', 'IPAD', 'ANDROID', 'WINDOWS', 'OTHER');

-- AlterTable
ALTER TABLE "public"."AuthSession" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "deviceType" "public"."DeviceType",
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT;
