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

    if (!Array.isArray(week.days)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'days must be an array');
    }

    const dayNumbers = new Set<number>();
    for (const day of week.days) {
      if (!Number.isInteger(day.dayNumber) || day.dayNumber < 1) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'dayNumber must be a positive integer');
      }
      if (dayNumbers.has(day.dayNumber)) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Duplicate dayNumber: ${day.dayNumber} in week ${week.weekNumber}`);
      }
      dayNumbers.add(day.dayNumber);

      if (day.exerciseIds) {
        if (!Array.isArray(day.exerciseIds)) throw new ApiError(httpStatus.BAD_REQUEST, 'exerciseIds must be an array of strings');
        allExerciseIds.push(...day.exerciseIds);
      }
    }
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

  // workouts are no longer supported in program days; only exercises are allowed
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
          days: {
            select: {
              id: true,
              dayNumber: true,
              name: true,
              exercises: { select: { id: true } },
            },
          },
        },
        orderBy: { weekNumber: 'asc' },
      },
    },
  });

  if (!program) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
  }

  let totalItems = 0;
  program.weeks.forEach((week) => {
    week.days.forEach((day) => {
      totalItems += day.exercises.length;
    });
  });

  return {
    program,
    totalExercises: totalItems, // keeping variable name for compatibility
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
            days: {
              create: week.days?.map((day) => ({
                dayNumber: day.dayNumber,
                name: day.name,
                exercises: day.exerciseIds?.length ? {
                  connect: day.exerciseIds.map((id) => ({ id })),
                } : undefined,
                workouts: day.workoutIds?.length ? {
                  connect: day.workoutIds.map((id) => ({ id })),
                } : undefined,
              })) || [],
            },
          })),
        },
      }),
    },
    include: {
      weeks: {
        orderBy: { weekNumber: 'asc' },
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
                include: { exercises: true },
          },
        },
      },
      category: true,
      
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
        // creator: true,
        // weeks: {
        //   orderBy: { weekNumber: 'asc' },
        //   include: { exercises: true },
        // },
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
      // creator: true,
      weeks: {
        orderBy: { weekNumber: 'asc' },
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: { exercises: true },
          },
        },
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
            days: {
              create: week.days?.map((day) => ({
                dayNumber: day.dayNumber,
                name: day.name,
                exercises: day.exerciseIds?.length ? {
                  connect: day.exerciseIds.map((id) => ({ id })),
                } : undefined,
                workouts: day.workoutIds?.length ? {
                  connect: day.workoutIds.map((id) => ({ id })),
                } : undefined,
              })) || [],
            },
          })),
        },
      }),
    },
    include: {
      weeks: {
        orderBy: { weekNumber: 'asc' },
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
                include: { exercises: true },
          },
        },
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

  // create per-user snapshot on activate
  try {
    await createProgramSnapshotForUser(userId, programId);
  } catch (err: any) {
    // don't fail activation if snapshot creation fails; log silently
    // eslint-disable-next-line no-console
    console.error('Failed to create program snapshot:', (err as any)?.message ?? err);
  }

  return enrollment;
};

// Create a per-user snapshot of the program structure when a user activates it
const createProgramSnapshotForUser = async (userId: string, programId: string) => {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      weeks: {
        orderBy: { weekNumber: 'asc' },
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: { exercises: { select: { id: true } } },
          },
        },
      },
    },
  });

  if (!program) throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');

  // If snapshot already exists for this user+program, do nothing
  const existing = await prisma.userProgramSnapshot.findFirst({ where: { userId, programId } });
  if (existing) return existing;

  // Create snapshot with nested weeks/days/items using transactions
  const created = await prisma.$transaction(async (tx) => {
    const snapshot = await tx.userProgramSnapshot.create({
      data: {
        userId,
        programId,
        title: program.title,
        description: program.description,
        thumbnail: program.thumbnail,
        difficulty: program.difficulty,
      },
    });

    for (const week of program.weeks) {
      const sw = await tx.snapshotWeek.create({ data: { snapshotId: snapshot.id, weekNumber: week.weekNumber } });
      for (const day of week.days) {
        const sd = await tx.snapshotDay.create({ data: { weekId: sw.id, dayNumber: day.dayNumber, name: day.name } });
        // create items for exercises only
        for (const ex of day.exercises) {
          await tx.snapshotItem.create({ data: { dayId: sd.id, exerciseId: ex.id } });
        }
      }
    }

    return snapshot;
  });

  return created;
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
              days: {
                select: {
                  id: true,
                  dayNumber: true,
                  name: true,
                  exercises: { select: { id: true } },
                },
                orderBy: { dayNumber: 'asc' },
              },
            },
            orderBy: { weekNumber: 'asc' },
          },
        },
      },
    },
  });

  return enrollments;
};

const getProgramSnapshot = async (userId: string, programId: string) => {
  ensureProgressDelegates();
  const snapshot = await prisma.userProgramSnapshot.findFirst({
    where: { userId, programId },
    include: {
      weeks: {
        orderBy: { weekNumber: 'asc' },
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: {
              items: {
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  if (!snapshot) throw new ApiError(httpStatus.NOT_FOUND, 'Snapshot not found for this user and program');

  // collect exercise ids to fetch details
  const exerciseIds: string[] = [];
  for (const w of snapshot.weeks) {
    for (const d of w.days) {
      for (const it of d.items) {
        if (it.exerciseId) exerciseIds.push(it.exerciseId);
      }
    }
  }

  const exercises = exerciseIds.length ? await prisma.exercise.findMany({ where: { id: { in: Array.from(new Set(exerciseIds)) } } }) : [];
  const exerciseMap = new Map((exercises as any[]).map((e: any) => [e.id, e]));

  // attach details to items (exercises only)
  const snapshotWithDetails = {
    ...snapshot,
    weeks: snapshot.weeks.map((w) => ({
      ...w,
      days: w.days.map((d) => ({
        ...d,
        items: d.items.map((it) => ({
          ...it,
          exercise: it.exerciseId ? exerciseMap.get(it.exerciseId) ?? null : null,
        })),
      })),
    })),
  };

  return snapshotWithDetails;
};

const setSnapshotItemDone = async (params: {
  userId: string;
  programId: string;
  snapshotWeekId: string;
  snapshotDayId: string;
  snapshotItemId: string;
  done: boolean;
}) => {
  const { userId, programId, snapshotWeekId, snapshotDayId, snapshotItemId, done } = params;

  // Validate snapshot belongs to user and program via joins
  const item = await prisma.snapshotItem.findUnique({
    where: { id: snapshotItemId },
    include: {
      day: { include: { week: { include: { snapshot: true } } } },
    },
  });

  if (!item) throw new ApiError(httpStatus.NOT_FOUND, 'Snapshot item not found');

  const snap = item.day?.week?.snapshot;
  if (!snap || snap.userId !== userId || snap.programId !== programId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Snapshot item does not belong to this user/program');
  }

  // Ensure week/day ids match (optional stricter check)
  if (item.day.week.id !== snapshotWeekId || item.day.id !== snapshotDayId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Snapshot week/day mismatch');
  }

  const updated = await prisma.snapshotItem.update({ where: { id: snapshotItemId }, data: { completed: done } });

  return updated;
};

const setExerciseDone = async (params: {
  userId: string;
  programId: string;
  programWeekId: string;
  programDayId: string;
  exerciseId?: string;
  done: boolean;
}) => {
  ensureProgressDelegates();
  const { userId, programId, programWeekId, programDayId, exerciseId, done } = params;

  if (!exerciseId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'exerciseId must be provided');
  }

  const day = await prisma.programDay.findFirst({
    where: {
      id: programDayId,
      week: {
        id: programWeekId,
        programId,
      },
    },
    select: {
      id: true,
      exercises: { select: { id: true } },
    },
  });

  if (!day) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program day not found');
  }

  const isExerciseInDay = day.exercises.some((e) => e.id === exerciseId);
  if (!isExerciseInDay) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Exercise is not part of this program day');
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
      programDayId: true,
      exerciseId: true,
    },
  });

  const completedExerciseSet = new Set(completions.filter(c => c.exerciseId).map((c) => `${c.programDayId}:${c.exerciseId}`));

  const weeks = program.weeks.map((week) => {
    let weekTotal = 0;
    let weekCompleted = 0;

      const days = week.days.map((day) => {
      const dayTotal = day.exercises.length;
      let dayCompleted = 0;

      dayCompleted += day.exercises.reduce(
        (sum, ex) => sum + (completedExerciseSet.has(`${day.id}:${ex.id}`) ? 1 : 0),
        0
      );

      weekTotal += dayTotal;
      weekCompleted += dayCompleted;

      return {
        programDayId: day.id,
        dayNumber: day.dayNumber,
        name: day.name,
        totalItems: dayTotal,
        completedItems: dayCompleted,
        percentCompleted: dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0,
      };
    });

    const weekPercent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

    return {
      programWeekId: week.id,
      weekNumber: week.weekNumber,
      totalItems: weekTotal,
      completedItems: weekCompleted,
      percentCompleted: weekPercent,
      days,
    };
  });

  const completedExercises = completions.length;
  const percentCompleted = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  return {
    programId: program.id,
    enrollment: enrollment ?? null,
    totalItems: totalExercises, // rename in output to avoid breaking change but actually keep it as totalExercises for now if needed, or totalItems. 
    // actually, let's keep totalExercises and add totalItems
    totalExercises: totalExercises,
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

const getMyTodaysChallenges = async (userId: string) => {
  ensureProgressDelegates();

  const enrollments = await prisma.userProgramEnrollment.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: {
      program: {
        include: {
          weeks: {
            include: {
              days: {
                include: {
                  exercises: {
                    include: {
                      videos: true,
                      category: true,
                    },
                  },
                },
                orderBy: { dayNumber: 'asc' },
              },
            },
            orderBy: { weekNumber: 'asc' },
          },
        },
      },
    },
  });

  const now = new Date();
  const challenges = [];

  for (const enrollment of enrollments) {
    const { program, startedAt } = enrollment;
    const diffTime = Math.max(0, now.getTime() - startedAt.getTime());
    const daysActive = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentWeekNumber = Math.floor(daysActive / 7) + 1;
    const dayOfWeek = (daysActive % 7) + 1;

    const currentWeek = program.weeks.find((w) => w.weekNumber === currentWeekNumber);
    if (!currentWeek || !currentWeek.days.length) {
      continue;
    }

    const dayIndex = (dayOfWeek - 1) % currentWeek.days.length;
    const currentDay = currentWeek.days[dayIndex];

    for (const exercise of currentDay.exercises) {
      const completion = await prisma.userProgramExerciseCompletion.findFirst({
        where: {
          userId,
          programId: program.id,
          exerciseId: exercise.id,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Only include if not completed (today's challenges should show incomplete items)
      if (!completion) {
        challenges.push({
          programId: program.id,
          programTitle: program.title,
          weekNumber: currentWeekNumber,
          dayOfWeek,
          programWeekId: currentWeek.id,
          programDayId: currentDay.id,
          dayName: currentDay.name,
          itemType: 'exercise',
          item: exercise,
          completed: false,
        });
      }
    }

    // workouts are not included in challenges anymore
  }

  return challenges;
};

const getMyUpcomingChallenges = async (userId: string) => {
  ensureProgressDelegates();

  const enrollments = await prisma.userProgramEnrollment.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: {
      program: {
        include: {
          weeks: {
            include: {
              days: {
                include: {
                  exercises: {
                    include: {
                      videos: true,
                      category: true,
                    },
                  },
                },
                orderBy: { dayNumber: 'asc' },
              },
            },
            orderBy: { weekNumber: 'asc' },
          },
        },
      },
    },
  });

  const now = new Date();
  const upcomingChallenges: any[] = [];

  for (const enrollment of enrollments) {
    const { program, startedAt } = enrollment;
    const diffTime = Math.max(0, now.getTime() - startedAt.getTime());
    const daysActive = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentWeekNumber = Math.floor(daysActive / 7) + 1;
    const dayOfWeek = (daysActive % 7) + 1;

    for (const week of program.weeks) {
      if (week.weekNumber < currentWeekNumber) {
        continue;
      }

      const startDayIndex = week.weekNumber === currentWeekNumber ? ((dayOfWeek - 1) % Math.max(1, week.days.length)) + 1 : 0;

      for (let i = startDayIndex; i < week.days.length; i++) {
        const day = week.days[i];

        let daysFromNow = 0;
        if (week.weekNumber === currentWeekNumber) {
          daysFromNow = i - ((dayOfWeek - 1) % Math.max(1, week.days.length));
        } else {
          const weeksDiff = week.weekNumber - currentWeekNumber;
          daysFromNow = weeksDiff * 7 + i - ((dayOfWeek - 1) % Math.max(1, week.days.length));
        }

        for (const exercise of day.exercises) {
          const completion = await prisma.userProgramExerciseCompletion.findFirst({
            where: {
              userId,
              programId: program.id,
              exerciseId: exercise.id,
            },
            orderBy: { createdAt: 'desc' },
          });

          // Only include if not completed (upcoming challenges should show incomplete items)
          if (!completion) {
            upcomingChallenges.push({
              programId: program.id,
              programTitle: program.title,
              weekNumber: week.weekNumber,
              dayNumber: day.dayNumber,
              programWeekId: week.id,
              programDayId: day.id,
              dayName: day.name,
              daysFromNow,
              itemType: 'exercise',
              item: exercise,
              completed: false,
            });
          }
        }

        // workouts are not included in upcoming challenges anymore
      }
    }
  }

  upcomingChallenges.sort((a, b) => a.daysFromNow - b.daysFromNow);

  return upcomingChallenges;
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
  getMyTodaysChallenges,
  getMyUpcomingChallenges,
  // snapshot APIs
  createProgramSnapshotForUser,
  getProgramSnapshot,
  setSnapshotItemDone,
};
