import httpStatus from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import prisma from '../../shared/prisma';

const ensureProgressDelegates = () => {
  const client = prisma as any;
  if (!client.userProgramEnrollment || !client.userProgramExerciseCompletion) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Prisma Client is out of date. Run `npx prisma generate` and restart the server.'
    );
  }
};

const ensureProgramExists = async (programId: string) => {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { id: true },
  });

  if (!program) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
  }
};

const getProgramTotals = async (programId: string) => {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: {
      id: true,
      weeks: {
        select: {
          id: true,
          weekNumber: true,
          exercises: { select: { id: true } },
        },
        orderBy: { weekNumber: 'asc' },
      },
    },
  });

  if (!program) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
  }

  const totalExercises = program.weeks.reduce((sum, week) => sum + week.exercises.length, 0);

  return {
    program,
    totalExercises,
  };
};

const activateProgram = async (userId: string, programId: string) => {
  ensureProgressDelegates();
  await ensureProgramExists(programId);

  const enrollment = await prisma.userProgramEnrollment.upsert({
    where: {
      userId_programId: {
        userId,
        programId,
      },
    },
    create: {
      userId,
      programId,
      status: 'ACTIVE',
    },
    update: {
      status: 'ACTIVE',
      completedAt: null,
    },
    include: {
      program: {
        include: {
          category: true,
        },
      },
    },
  });

  return enrollment;
};

const getMyActivePrograms = async (userId: string) => {
  ensureProgressDelegates();
  const enrollments = await prisma.userProgramEnrollment.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      program: {
        include: {
          category: true,
          weeks: {
            select: {
              id: true,
              weekNumber: true,
              exercises: { select: { id: true } },
            },
            orderBy: { weekNumber: 'asc' },
          },
        },
      },
    },
  });

  return enrollments;
};

const setExerciseDone = async (params: {
  userId: string;
  programId: string;
  programWeekId: string;
  exerciseId: string;
  done: boolean;
}) => {
  ensureProgressDelegates();
  const { userId, programId, programWeekId, exerciseId, done } = params;

  // Validate week belongs to program and exercise is part of the week
  const week = await prisma.programWeek.findFirst({
    where: {
      id: programWeekId,
      programId,
    },
    select: {
      id: true,
      weekNumber: true,
      exercises: { select: { id: true } },
    },
  });

  if (!week) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program week not found');
  }

  const isExerciseInWeek = week.exercises.some((e) => e.id === exerciseId);
  if (!isExerciseInWeek) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Exercise is not part of this program week');
  }

  // Auto-activate (enroll) if needed
  await prisma.userProgramEnrollment.upsert({
    where: {
      userId_programId: {
        userId,
        programId,
      },
    },
    create: {
      userId,
      programId,
      status: 'ACTIVE',
    },
    update: {
      // If they were COMPLETED and undo later, we’ll set status based on totals below
      status: 'ACTIVE',
      completedAt: null,
    },
  });

  if (done) {
    await prisma.userProgramExerciseCompletion.upsert({
      where: {
        user_week_exercise: {
          userId,
          programWeekId,
          exerciseId,
        },
      },
      create: {
        userId,
        programId,
        programWeekId,
        exerciseId,
      },
      update: {
        completedAt: new Date(),
      },
    });
  } else {
    await prisma.userProgramExerciseCompletion.deleteMany({
      where: {
        userId,
        programWeekId,
        exerciseId,
      },
    });
  }

  const { totalExercises } = await getProgramTotals(programId);
  const completedExercises = await prisma.userProgramExerciseCompletion.count({
    where: {
      userId,
      programId,
    },
  });

  const percentCompleted = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  if (totalExercises > 0 && completedExercises >= totalExercises) {
    await prisma.userProgramEnrollment.update({
      where: {
        userId_programId: {
          userId,
          programId,
        },
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  } else {
    await prisma.userProgramEnrollment.update({
      where: {
        userId_programId: {
          userId,
          programId,
        },
      },
      data: {
        status: 'ACTIVE',
        completedAt: null,
      },
    });
  }

  return {
    done,
    totalExercises,
    completedExercises,
    percentCompleted,
  };
};

const getProgramProgress = async (userId: string, programId: string) => {
  ensureProgressDelegates();
  const enrollment = await prisma.userProgramEnrollment.findUnique({
    where: {
      userId_programId: {
        userId,
        programId,
      },
    },
    select: {
      status: true,
      startedAt: true,
      completedAt: true,
    },
  });

  const { program, totalExercises } = await getProgramTotals(programId);

  const completions = await prisma.userProgramExerciseCompletion.findMany({
    where: {
      userId,
      programId,
    },
    select: {
      programWeekId: true,
      exerciseId: true,
    },
  });

  const completedSet = new Set(completions.map((c) => `${c.programWeekId}:${c.exerciseId}`));

  const weeks = program.weeks.map((week) => {
    const weekTotal = week.exercises.length;
    const weekCompleted = week.exercises.reduce(
      (sum, ex) => sum + (completedSet.has(`${week.id}:${ex.id}`) ? 1 : 0),
      0
    );
    const weekPercent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

    return {
      programWeekId: week.id,
      weekNumber: week.weekNumber,
      totalExercises: weekTotal,
      completedExercises: weekCompleted,
      percentCompleted: weekPercent,
    };
  });

  const completedExercises = completions.length;
  const percentCompleted = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  return {
    programId: program.id,
    enrollment: enrollment ?? null,
    totalExercises,
    completedExercises,
    percentCompleted,
    weeks,
  };
};

export const programProgressService = {
  activateProgram,
  getMyActivePrograms,
  setExerciseDone,
  getProgramProgress,
};
