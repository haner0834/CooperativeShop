-- AlterTable
ALTER TABLE "WorkSchedule" ADD COLUMN     "scheduleNote" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'FIXED';
