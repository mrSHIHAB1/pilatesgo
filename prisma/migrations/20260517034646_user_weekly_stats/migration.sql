-- AlterTable
ALTER TABLE "User" ADD COLUMN     "weeklyStatsUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "weeklyStatsWeekStart" TIMESTAMP(3),
ADD COLUMN     "weeklyStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weeklyTimeSpentSeconds" INTEGER NOT NULL DEFAULT 0;
