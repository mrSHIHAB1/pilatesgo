import httpStatus from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import prisma from '../../shared/prisma';
import { ICreateProgramRequest, IUpdateProgramRequest, IProgramResponse, IProgramListResponse } from './program.interface';

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

// Create a new program
const createProgram = async (payload: ICreateProgramRequest): Promise<IProgramResponse> => {
  // Check if program with same title already exists
  const existingProgram = await prisma.program.findFirst({
    where: { title: payload.title },
  });

  if (existingProgram) {
    throw new ApiError(httpStatus.CONFLICT, 'Program with this title already exists');
  }

  // Validate category exists if categoryId is provided
  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });

    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }
  }

  // Validate user exists if creatorId is provided
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

// Get all programs with pagination, search, and filters
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

// Get a specific program by ID
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

// Update a program
const updateProgram = async (id: string, payload: IUpdateProgramRequest): Promise<IProgramResponse> => {
  // Check if program exists
  const program = await prisma.program.findUnique({
    where: { id },
  });

  if (!program) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
  }

  // Check if title already exists (excluding current program)
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

  // Validate category exists if categoryId is provided
  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });

    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }
  }

  // Validate user exists if creatorId is provided
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

// Delete a program
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

export const programService = {
  createProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
};
