/*
  Warnings:

  - You are about to drop the column `activity` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `familiarity` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `workoutProblem` on the `User` table. All the data in the column will be lost.
  - The `gender` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `workoutPreference` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `workoutRoutine` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AttentionArea" AS ENUM ('ARMS', 'LEGS', 'CHEST', 'ABS', 'BACK');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "FitnessLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('NEWBIE', 'REGULAR', 'INTERMEDIATE', 'ADVANCED', 'PRO');

-- CreateEnum
CREATE TYPE "WorkoutPreference" AS ENUM ('HOME', 'GYM', 'BOTH');

-- CreateEnum
CREATE TYPE "WorkoutRoutine" AS ENUM ('SHORT', 'MEDIUM', 'LONG');

-- CreateEnum
CREATE TYPE "UnitSystem" AS ENUM ('METERANDGRAMS', 'POUNDSANDFEET');

-- CreateEnum
CREATE TYPE "FocusZone" AS ENUM ('FULL_BODY', 'CORE', 'UPPER_BODY', 'LOWER_BODY', 'GLUTES', 'BACK', 'ARMS', 'LEGS');

-- CreateEnum
CREATE TYPE "SpecialProgram" AS ENUM ('WEIGHT_LOSS', 'STRENGTH', 'FLEXIBILITY', 'MOBILITY', 'POSTURE');

-- CreateEnum
CREATE TYPE "WorkoutClass" AS ENUM ('PILATES', 'YOGA', 'CARDIO', 'STRENGTH', 'STRETCH');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "activity",
DROP COLUMN "familiarity",
DROP COLUMN "workoutProblem",
ADD COLUMN     "NotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "activeCurrently" TEXT,
ADD COLUMN     "activityDetails" TEXT,
ADD COLUMN     "activitylevel" "ActivityLevel",
ADD COLUMN     "classes" "WorkoutClass"[],
ADD COLUMN     "currentWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "dailyStepsGoal" INTEGER DEFAULT 10000,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "fimiliarityWithPilates" TEXT,
ADD COLUMN     "fitnessLevel" "FitnessLevel",
ADD COLUMN     "focusZones" "FocusZone"[],
ADD COLUMN     "goalWeight" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "likeToWorkOn" TEXT,
ADD COLUMN     "mostAttentionTo" "AttentionArea",
ADD COLUMN     "specialPrograms" "SpecialProgram"[],
ADD COLUMN     "startingWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "units" "UnitSystem" NOT NULL DEFAULT 'METERANDGRAMS',
ADD COLUMN     "wayOfWorkingOut" TEXT,
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender",
ALTER COLUMN "age" DROP NOT NULL,
ALTER COLUMN "height" SET DEFAULT 0,
ALTER COLUMN "weight" SET DEFAULT 0,
ALTER COLUMN "mainGoal" DROP NOT NULL,
DROP COLUMN "workoutPreference",
ADD COLUMN     "workoutPreference" "WorkoutPreference",
ALTER COLUMN "motivation" DROP NOT NULL,
DROP COLUMN "workoutRoutine",
ADD COLUMN     "workoutRoutine" "WorkoutRoutine";
