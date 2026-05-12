import httpStatus from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import prisma from '../../shared/prisma';
import { ICreateWorkoutRequest, IUpdateWorkoutRequest, IWorkoutResponse, IWorkoutListResponse } from './workout.interface';

// Create a new workout
const createWorkout = async (payload: ICreateWorkoutRequest): Promise<IWorkoutResponse> => {
  // Check if workout with same title already exists
  const existingWorkout = await prisma.workout.findFirst({
    where: { title: payload.title },
  });

  if (existingWorkout) {
    throw new ApiError(httpStatus.CONFLICT, 'Workout with this title already exists');
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

  // Validate program exists if programId is provided
  if (payload.programId) {
    const program = await prisma.program.findUnique({
      where: { id: payload.programId },
    });

    if (!program) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
    }
  }

  // Validate exercises exist if exerciseIds are provided
  if (payload.exerciseIds && payload.exerciseIds.length > 0) {
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: payload.exerciseIds } },
    });

    if (exercises.length !== payload.exerciseIds.length) {
      throw new ApiError(httpStatus.NOT_FOUND, 'One or more exercises not found');
    }
  }

  const workout = await prisma.workout.create({
    data: {
      title: payload.title,
      difficulty: payload.difficulty,
      description: payload.description,
      duration: payload.duration,
      categoryId: payload.categoryId,
      creatorId: payload.creatorId,
      programId: payload.programId,
      // Connect exercises to the workout
      ...(payload.exerciseIds && payload.exerciseIds.length > 0 && {
        exercises: {
          connect: payload.exerciseIds.map((id) => ({ id })),
        },
      }),
    },
    include: {
      exercises: true,
      category: true,
      creator: true,
      program: true,
    },
  });

  return workout;
};

// Get all workouts with pagination, search, and filters
const getAllWorkouts = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  categoryId?: string,
  difficulty?: string,
  creatorId?: string,
  programId?: string
): Promise<IWorkoutListResponse> => {
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

  if (programId) {
    where.programId = programId;
  }

  const [workouts, total] = await Promise.all([
    prisma.workout.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
     
        program: true,
        exercises: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.workout.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: workouts,
    total,
    page,
    limit,
    totalPages,
  };
};

// Get a specific workout by ID
const getWorkoutById = async (id: string): Promise<any> => {
  const workout = await prisma.workout.findUnique({
    where: { id },
    include: {
      category: true,
      creator: true,
      program: true,
      exercises: true,
    },
  });

  if (!workout) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Workout not found');
  }

  return workout;
};

// Update a workout
const updateWorkout = async (id: string, payload: IUpdateWorkoutRequest): Promise<IWorkoutResponse> => {
  // Check if workout exists
  const workout = await prisma.workout.findUnique({
    where: { id },
  });

  if (!workout) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Workout not found');
  }

  // Check if title already exists (excluding current workout)
  if (payload.title) {
    const existingWorkout = await prisma.workout.findFirst({
      where: {
        title: payload.title,
        NOT: { id },
      },
    });

    if (existingWorkout) {
      throw new ApiError(httpStatus.CONFLICT, 'Workout with this title already exists');
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

  // Validate program exists if programId is provided
  if (payload.programId) {
    const program = await prisma.program.findUnique({
      where: { id: payload.programId },
    });

    if (!program) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
    }
  }

  // Validate exercises exist if exerciseIds are provided
  if (payload.exerciseIds && payload.exerciseIds.length > 0) {
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: payload.exerciseIds } },
    });

    if (exercises.length !== payload.exerciseIds.length) {
      throw new ApiError(httpStatus.NOT_FOUND, 'One or more exercises not found');
    }
  }

  const updatedWorkout = await prisma.workout.update({
    where: { id },
    data: {
      title: payload.title,
      difficulty: payload.difficulty,
      description: payload.description,
      duration: payload.duration,
      categoryId: payload.categoryId,
      creatorId: payload.creatorId,
      programId: payload.programId,
      // Update exercises connection
      ...(payload.exerciseIds && {
        exercises: {
          set: payload.exerciseIds.map((id) => ({ id })),
        },
      }),
    },
    include: {
      exercises: true,
      category: true,
      creator: true,
      program: true,
    },
  });

  return updatedWorkout;
};

// Delete a workout
const deleteWorkout = async (id: string): Promise<IWorkoutResponse> => {
  const workout = await prisma.workout.findUnique({
    where: { id },
  });

  if (!workout) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Workout not found');
  }

  const deletedWorkout = await prisma.workout.delete({
    where: { id },
  });

  return deletedWorkout;
};

export const workoutService = {
  createWorkout,
  getAllWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
};
