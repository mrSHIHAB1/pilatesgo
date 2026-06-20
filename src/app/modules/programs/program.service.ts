import httpStatus from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import prisma from '../../shared/prisma';
import { fileUploader } from '../../helpers/fileUploader';
import {
  ICreateProgramRequest,
  IUpdateProgramRequest,
  IProgramResponse,
  IProgramListResponse,
  ICreateReviewPayload
} from './program.interface';

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

const validateWeeksPayload = async (weeks: NonNullable<ICreateProgramRequest['weeks']>): Promise<void> => {
  const weekNumbers = new Set<number>();
  const allExerciseIds: string[] = [];

  for (const week of weeks) {
    if (!Number.isInteger(week.weekNumber) || week.weekNumber < 1) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'weekNumber must be a positive integer');
    }
    if (weekNumbers.has(week.weekNumber)) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Duplicate weekNumber: ${week.weekNumber}`);
    }
    weekNumbers.add(week.weekNumber);

    if (!Array.isArray(week.exerciseIds)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'exerciseIds must be an array of strings');
    }

    const uniqueWeekExerciseIds = new Set(week.exerciseIds);
    if (uniqueWeekExerciseIds.size !== week.exerciseIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Duplicate exerciseIds found in weekNumber ${week.weekNumber}`
      );
    }

    allExerciseIds.push(...week.exerciseIds);
  }

  const uniqueExerciseIds = Array.from(new Set(allExerciseIds));
  if (uniqueExerciseIds.length > 0) {
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: uniqueExerciseIds } },
      select: { id: true },
    });

    if (exercises.length !== uniqueExerciseIds.length) {
      const found = new Set(exercises.map((e) => e.id));
      const missing = uniqueExerciseIds.filter((id) => !found.has(id));
      throw new ApiError(
        httpStatus.NOT_FOUND,
        `One or more exercises not found: ${missing.join(', ')}`
      );
    }
  }
};

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

// ─── PROGRAM SERVICES ─────────────────────────────────────────────────────────

const createProgram = async (payload: ICreateProgramRequest): Promise<IProgramResponse> => {
  const existingProgram = await prisma.program.findFirst({
    where: { title: payload.title },
  });

  if (existingProgram) {
    throw new ApiError(httpStatus.CONFLICT, 'Program with this title already exists');
  }

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });

    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }
  }

  if (payload.creatorId) {
    const creator = await prisma.user.findUnique({
      where: { id: payload.creatorId },
    });

    if (!creator) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Creator not found');
    }
  }

  if (payload.weeks) {
    await validateWeeksPayload(payload.weeks);
  }

  const program = await prisma.program.create({
    data: {
      title: payload.title,
      difficulty: payload.difficulty,
      description: payload.description,
      thumbnail: payload.thumbnail,
      creatorId: payload.creatorId,
      categoryId: payload.categoryId,
      durationWeeks: payload.durationWeeks,
      coverImage: payload.coverImage,
      ...(payload.weeks && {
        weeks: {
          create: payload.weeks.map((week) => ({
            weekNumber: week.weekNumber,
            exercises: {
              connect: week.exerciseIds.map((id) => ({ id })),
            },
          })),
        },
      }),
    },
    include: {
      weeks: {
        orderBy: { weekNumber: 'asc' },
        include: { exercises: true },
      },
      category: true,
      creator: true,
    },
  });

  return program;
};

const getAllPrograms = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  categoryId?: string,
  difficulty?: string,
  creatorId?: string
): Promise<IProgramListResponse> => {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (difficulty) {
    where.difficulty = difficulty;
  }

  if (creatorId) {
    where.creatorId = creatorId;
  }

  const [programs, total] = await Promise.all([
    prisma.program.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        creator: true,
        weeks: {
          orderBy: { weekNumber: 'asc' },
          include: { exercises: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.program.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: programs,
    total,
    page,
    limit,
    totalPages,
  };
};

const getProgramById = async (id: string): Promise<any> => {
  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      category: true,
      creator: true,
      weeks: {
        orderBy: { weekNumber: 'asc' },
        include: { exercises: true },
      },
    },
  });

  if (!program) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
  }

  return program;
};

const updateProgram = async (id: string, payload: IUpdateProgramRequest): Promise<IProgramResponse> => {
  const program = await prisma.program.findUnique({
    where: { id },
  });

  if (!program) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
  }

  if (payload.title) {
    const existingProgram = await prisma.program.findFirst({
      where: {
        title: payload.title,
        NOT: { id },
      },
    });

    if (existingProgram) {
      throw new ApiError(httpStatus.CONFLICT, 'Program with this title already exists');
    }
  }

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });

    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }
  }

  if (payload.creatorId) {
    const creator = await prisma.user.findUnique({
      where: { id: payload.creatorId },
    });

    if (!creator) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Creator not found');
    }
  }

  if (payload.weeks) {
    await validateWeeksPayload(payload.weeks);
  }

  const updatedProgram = await prisma.program.update({
    where: { id },
    data: {
      title: payload.title,
      difficulty: payload.difficulty,
      description: payload.description,
      thumbnail: payload.thumbnail,
      creatorId: payload.creatorId,
      categoryId: payload.categoryId,
      durationWeeks: payload.durationWeeks,
      coverImage: payload.coverImage,
      ...(payload.weeks && {
        weeks: {
          deleteMany: {},
          create: payload.weeks.map((week) => ({
            weekNumber: week.weekNumber,
            exercises: {
              connect: week.exerciseIds.map((exerciseId) => ({ id: exerciseId })),
            },
          })),
        },
      }),
    },
    include: {
      weeks: {
        orderBy: { weekNumber: 'asc' },
        include: { exercises: true },
      },
      category: true,
      creator: true,
    },
  });

  return updatedProgram;
};

const deleteProgram = async (id: string): Promise<IProgramResponse> => {
  const program = await prisma.program.findUnique({
    where: { id },
  });

  if (!program) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
  }

  const deletedProgram = await prisma.program.delete({
    where: { id },
  });

  return deletedProgram;
};

// ─── PROGRESS SERVICES ────────────────────────────────────────────────────────

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

// ─── REVIEW SERVICES ──────────────────────────────────────────────────────────

const createOrUpdateReview = async (
  userId: string,
  programId: string,
  payload: ICreateReviewPayload,
  photoFiles?: Express.Multer.File[]
): Promise<any> => {
  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
  }

  if (payload.rating < 1 || payload.rating > 5) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Rating must be between 1 and 5');
  }

  let photoUrls: string[] = [];
  if (photoFiles && photoFiles.length > 0) {
    const uploaded = await fileUploader.uploadManyToCloudinary(photoFiles);
    photoUrls = uploaded.map((u) => u.url).filter(Boolean);
  }

  const existingReview = await prisma.programReview.findUnique({
    where: { userId_programId: { userId, programId } },
  });

  const existingPhotos = existingReview?.photos ?? [];
  const mergedPhotos =
    photoFiles && photoFiles.length > 0 ? photoUrls : existingPhotos;

  const review = await prisma.programReview.upsert({
    where: { userId_programId: { userId, programId } },
    update: {
      rating: payload.rating,
      comment: payload.comment,
      photos: mergedPhotos,
    },
    create: {
      userId,
      programId,
      rating: payload.rating,
      comment: payload.comment,
      photos: mergedPhotos,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  return review;
};

const getReviewsForProgram = async (
  programId: string,
  page: number = 1,
  limit: number = 10
) => {
  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
  }

  const skip = (page - 1) * limit;

  const [reviews, total, aggregate] = await Promise.all([
    prisma.programReview.findMany({
      where: { programId },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.programReview.count({ where: { programId } }),
    prisma.programReview.aggregate({
      where: { programId },
      _avg: { rating: true },
    }),
  ]);

  return {
    data: reviews,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    averageRating: aggregate._avg.rating
      ? parseFloat(aggregate._avg.rating.toFixed(1))
      : null,
  };
};

const deleteMyReview = async (userId: string, programId: string): Promise<void> => {
  const existing = await prisma.programReview.findUnique({
    where: { userId_programId: { userId, programId } },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
  }

  await prisma.programReview.delete({
    where: { userId_programId: { userId, programId } },
  });
};

const getMyReview = async (userId: string, programId: string) => {
  const review = await prisma.programReview.findUnique({
    where: { userId_programId: { userId, programId } },
    include: {
      user: {
        select: { id: true, fullName: true },
      },
    },
  });

  return review;
};

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

export const programService = {
  createProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
  activateProgram,
  getMyActivePrograms,
  setExerciseDone,
  getProgramProgress,
  createOrUpdateReview,
  getReviewsForProgram,
  deleteMyReview,
  getMyReview,
};
