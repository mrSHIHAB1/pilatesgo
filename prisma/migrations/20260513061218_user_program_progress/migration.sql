-- CreateEnum
CREATE TYPE "ProgramEnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateTable
CREATE TABLE "UserProgramEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "status" "ProgramEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgramEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProgramExerciseCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "programWeekId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProgramExerciseCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserProgramEnrollment_userId_status_idx" ON "UserProgramEnrollment"("userId", "status");

-- CreateIndex
CREATE INDEX "UserProgramEnrollment_programId_idx" ON "UserProgramEnrollment"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProgramEnrollment_userId_programId_key" ON "UserProgramEnrollment"("userId", "programId");

-- CreateIndex
CREATE INDEX "UserProgramExerciseCompletion_userId_programId_idx" ON "UserProgramExerciseCompletion"("userId", "programId");

-- CreateIndex
CREATE INDEX "UserProgramExerciseCompletion_programWeekId_idx" ON "UserProgramExerciseCompletion"("programWeekId");

-- CreateIndex
CREATE INDEX "UserProgramExerciseCompletion_exerciseId_idx" ON "UserProgramExerciseCompletion"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProgramExerciseCompletion_userId_programWeekId_exercise_key" ON "UserProgramExerciseCompletion"("userId", "programWeekId", "exerciseId");

-- AddForeignKey
ALTER TABLE "UserProgramEnrollment" ADD CONSTRAINT "UserProgramEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgramEnrollment" ADD CONSTRAINT "UserProgramEnrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgramExerciseCompletion" ADD CONSTRAINT "UserProgramExerciseCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgramExerciseCompletion" ADD CONSTRAINT "UserProgramExerciseCompletion_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgramExerciseCompletion" ADD CONSTRAINT "UserProgramExerciseCompletion_programWeekId_fkey" FOREIGN KEY ("programWeekId") REFERENCES "ProgramWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgramExerciseCompletion" ADD CONSTRAINT "UserProgramExerciseCompletion_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
