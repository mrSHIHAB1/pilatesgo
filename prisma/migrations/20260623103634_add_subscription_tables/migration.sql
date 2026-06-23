/*
  Warnings:

  - You are about to drop the `_ProgramWeekExercises` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CHAT_MESSAGE', 'FEEDBACK_SUBMITTED', 'SYSTEM', 'NEW_LIKE', 'NEW_MATCH', 'POST_LIKED', 'COMMENT_LIKED', 'POST_COMMENTED', 'BADGE_EARNED', 'BADGE_DOWNGRADE_WARNING', 'BADGE_PROXIMITY', 'CLUBHOUSE_INACTIVITY', 'SUBSCRIPTION_CHANGE', 'PAYMENT_ALERT', 'ADMIN_UPDATE', 'WEEKLY_UPDATE');

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PAUSED');

-- DropForeignKey
ALTER TABLE "_ProgramWeekExercises" DROP CONSTRAINT "_ProgramWeekExercises_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProgramWeekExercises" DROP CONSTRAINT "_ProgramWeekExercises_B_fkey";

-- AlterTable
ALTER TABLE "UserProgramExerciseCompletion" ALTER COLUMN "exerciseId" DROP NOT NULL;

-- DropTable
DROP TABLE "_ProgramWeekExercises";

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProgramSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "difficulty" "DifficultyLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgramSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnapshotWeek" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SnapshotWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnapshotDay" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SnapshotDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnapshotItem" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "workoutId" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SnapshotItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramDay" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SubscriptionType" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "renewalDate" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "type" "SubscriptionType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "durationDays" INTEGER NOT NULL,
    "features" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProgramDayExercises" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProgramDayExercises_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProgramDayWorkouts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProgramDayWorkouts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "UserProgramSnapshot_userId_programId_idx" ON "UserProgramSnapshot"("userId", "programId");

-- CreateIndex
CREATE INDEX "SnapshotWeek_snapshotId_idx" ON "SnapshotWeek"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "SnapshotWeek_snapshotId_weekNumber_key" ON "SnapshotWeek"("snapshotId", "weekNumber");

-- CreateIndex
CREATE INDEX "SnapshotDay_weekId_idx" ON "SnapshotDay"("weekId");

-- CreateIndex
CREATE UNIQUE INDEX "SnapshotDay_weekId_dayNumber_key" ON "SnapshotDay"("weekId", "dayNumber");

-- CreateIndex
CREATE INDEX "SnapshotItem_dayId_idx" ON "SnapshotItem"("dayId");

-- CreateIndex
CREATE INDEX "SnapshotItem_exerciseId_idx" ON "SnapshotItem"("exerciseId");

-- CreateIndex
CREATE INDEX "SnapshotItem_workoutId_idx" ON "SnapshotItem"("workoutId");

-- CreateIndex
CREATE UNIQUE INDEX "SnapshotItem_dayId_exerciseId_key" ON "SnapshotItem"("dayId", "exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "SnapshotItem_dayId_workoutId_key" ON "SnapshotItem"("dayId", "workoutId");

-- CreateIndex
CREATE INDEX "ProgramDay_weekId_idx" ON "ProgramDay"("weekId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramDay_weekId_dayNumber_key" ON "ProgramDay"("weekId", "dayNumber");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_endDate_idx" ON "Subscription"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_type_key" ON "SubscriptionPlan"("type");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_type_idx" ON "SubscriptionPlan"("type");

-- CreateIndex
CREATE INDEX "_ProgramDayExercises_B_index" ON "_ProgramDayExercises"("B");

-- CreateIndex
CREATE INDEX "_ProgramDayWorkouts_B_index" ON "_ProgramDayWorkouts"("B");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnapshotWeek" ADD CONSTRAINT "SnapshotWeek_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "UserProgramSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnapshotDay" ADD CONSTRAINT "SnapshotDay_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "SnapshotWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnapshotItem" ADD CONSTRAINT "SnapshotItem_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "SnapshotDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramDay" ADD CONSTRAINT "ProgramDay_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "ProgramWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramDayExercises" ADD CONSTRAINT "_ProgramDayExercises_A_fkey" FOREIGN KEY ("A") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramDayExercises" ADD CONSTRAINT "_ProgramDayExercises_B_fkey" FOREIGN KEY ("B") REFERENCES "ProgramDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramDayWorkouts" ADD CONSTRAINT "_ProgramDayWorkouts_A_fkey" FOREIGN KEY ("A") REFERENCES "ProgramDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramDayWorkouts" ADD CONSTRAINT "_ProgramDayWorkouts_B_fkey" FOREIGN KEY ("B") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
