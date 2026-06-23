-- Create join table for ProgramDay <-> Exercise
CREATE TABLE IF NOT EXISTS "_ProgramDayExercises" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_ProgramDayExercises_AB_pkey" PRIMARY KEY ("A", "B")
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexname = '_ProgramDayExercises_B_index') THEN
    CREATE INDEX "_ProgramDayExercises_B_index" ON "_ProgramDayExercises"("B");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Exercise') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ProgramDayExercises_A_fkey') THEN
    ALTER TABLE "_ProgramDayExercises" ADD CONSTRAINT "_ProgramDayExercises_A_fkey" FOREIGN KEY ("A") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ProgramDay') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ProgramDayExercises_B_fkey') THEN
    ALTER TABLE "_ProgramDayExercises" ADD CONSTRAINT "_ProgramDayExercises_B_fkey" FOREIGN KEY ("B") REFERENCES "ProgramDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Create join table for ProgramDay <-> Workout
CREATE TABLE IF NOT EXISTS "_ProgramDayWorkouts" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_ProgramDayWorkouts_AB_pkey" PRIMARY KEY ("A", "B")
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexname = '_ProgramDayWorkouts_B_index') THEN
    CREATE INDEX "_ProgramDayWorkouts_B_index" ON "_ProgramDayWorkouts"("B");
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Workout') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ProgramDayWorkouts_A_fkey') THEN
    ALTER TABLE "_ProgramDayWorkouts" ADD CONSTRAINT "_ProgramDayWorkouts_A_fkey" FOREIGN KEY ("A") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ProgramDay') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ProgramDayWorkouts_B_fkey') THEN
    ALTER TABLE "_ProgramDayWorkouts" ADD CONSTRAINT "_ProgramDayWorkouts_B_fkey" FOREIGN KEY ("B") REFERENCES "ProgramDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Done