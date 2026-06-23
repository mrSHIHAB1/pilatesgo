CREATE INDEX IF NOT EXISTS "_ProgramDayExercises_B_index" ON "_ProgramDayExercises"("B");
CREATE INDEX IF NOT EXISTS "_ProgramDayWorkouts_B_index" ON "_ProgramDayWorkouts"("B");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ProgramDayExercises_A_fkey') THEN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Exercise') THEN
      ALTER TABLE "_ProgramDayExercises" ADD CONSTRAINT "_ProgramDayExercises_A_fkey" FOREIGN KEY ("A") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ProgramDayExercises_B_fkey') THEN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ProgramDay') THEN
      ALTER TABLE "_ProgramDayExercises" ADD CONSTRAINT "_ProgramDayExercises_B_fkey" FOREIGN KEY ("B") REFERENCES "ProgramDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ProgramDayWorkouts_A_fkey') THEN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Workout') THEN
      ALTER TABLE "_ProgramDayWorkouts" ADD CONSTRAINT "_ProgramDayWorkouts_A_fkey" FOREIGN KEY ("A") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ProgramDayWorkouts_B_fkey') THEN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ProgramDay') THEN
      ALTER TABLE "_ProgramDayWorkouts" ADD CONSTRAINT "_ProgramDayWorkouts_B_fkey" FOREIGN KEY ("B") REFERENCES "ProgramDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;