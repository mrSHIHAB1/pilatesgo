-- Add ProgramDay if missing
CREATE TABLE IF NOT EXISTS "ProgramDay" (
  "id" TEXT PRIMARY KEY,
  "weekId" TEXT NOT NULL,
  "dayNumber" INTEGER NOT NULL,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProgramDay_weekId_dayNumber_key" ON "ProgramDay"("weekId","dayNumber");
CREATE INDEX IF NOT EXISTS "ProgramDay_weekId_idx" ON "ProgramDay"("weekId");
-- add foreign key to ProgramWeek if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ProgramWeek') THEN
    BEGIN
      ALTER TABLE "ProgramDay" ADD CONSTRAINT IF NOT EXISTS "ProgramDay_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "ProgramWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Create snapshot tables
CREATE TABLE IF NOT EXISTS "UserProgramSnapshot" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "thumbnail" TEXT,
  "difficulty" "DifficultyLevel" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "UserProgramSnapshot_userId_programId_idx" ON "UserProgramSnapshot"("userId","programId");
-- add optional foreign keys if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = '"User"' OR relname = 'User') AND EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Program') THEN
    BEGIN
      ALTER TABLE "UserProgramSnapshot" ADD CONSTRAINT IF NOT EXISTS "UserProgramSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "UserProgramSnapshot" ADD CONSTRAINT IF NOT EXISTS "UserProgramSnapshot_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "SnapshotWeek" (
  "id" TEXT PRIMARY KEY,
  "snapshotId" TEXT NOT NULL,
  "weekNumber" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "SnapshotWeek_snapshotId_weekNumber_key" ON "SnapshotWeek"("snapshotId","weekNumber");
CREATE INDEX IF NOT EXISTS "SnapshotWeek_snapshotId_idx" ON "SnapshotWeek"("snapshotId");
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'UserProgramSnapshot') THEN
    BEGIN
      ALTER TABLE "SnapshotWeek" ADD CONSTRAINT IF NOT EXISTS "SnapshotWeek_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "UserProgramSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "SnapshotDay" (
  "id" TEXT PRIMARY KEY,
  "weekId" TEXT NOT NULL,
  "dayNumber" INTEGER NOT NULL,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "SnapshotDay_weekId_dayNumber_key" ON "SnapshotDay"("weekId","dayNumber");
CREATE INDEX IF NOT EXISTS "SnapshotDay_weekId_idx" ON "SnapshotDay"("weekId");
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'SnapshotWeek') THEN
    BEGIN
      ALTER TABLE "SnapshotDay" ADD CONSTRAINT IF NOT EXISTS "SnapshotDay_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "SnapshotWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "SnapshotItem" (
  "id" TEXT PRIMARY KEY,
  "dayId" TEXT NOT NULL,
  "exerciseId" TEXT,
  "workoutId" TEXT,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "snapshot_day_exercise" ON "SnapshotItem"("dayId","exerciseId");
CREATE UNIQUE INDEX IF NOT EXISTS "snapshot_day_workout" ON "SnapshotItem"("dayId","workoutId");
CREATE INDEX IF NOT EXISTS "SnapshotItem_dayId_idx" ON "SnapshotItem"("dayId");
CREATE INDEX IF NOT EXISTS "SnapshotItem_exerciseId_idx" ON "SnapshotItem"("exerciseId");
CREATE INDEX IF NOT EXISTS "SnapshotItem_workoutId_idx" ON "SnapshotItem"("workoutId");
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'SnapshotDay') THEN
    BEGIN
      ALTER TABLE "SnapshotItem" ADD CONSTRAINT IF NOT EXISTS "SnapshotItem_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "SnapshotDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Done
