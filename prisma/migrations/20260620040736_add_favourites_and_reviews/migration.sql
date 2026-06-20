-- CreateTable
CREATE TABLE "WorkoutFavourite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutFavourite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "photos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutFavourite_userId_idx" ON "WorkoutFavourite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutFavourite_userId_workoutId_key" ON "WorkoutFavourite"("userId", "workoutId");

-- CreateIndex
CREATE INDEX "ProgramReview_programId_idx" ON "ProgramReview"("programId");

-- CreateIndex
CREATE INDEX "ProgramReview_userId_idx" ON "ProgramReview"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramReview_userId_programId_key" ON "ProgramReview"("userId", "programId");

-- AddForeignKey
ALTER TABLE "WorkoutFavourite" ADD CONSTRAINT "WorkoutFavourite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutFavourite" ADD CONSTRAINT "WorkoutFavourite_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramReview" ADD CONSTRAINT "ProgramReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramReview" ADD CONSTRAINT "ProgramReview_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
