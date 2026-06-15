import httpStatus from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import prisma from '../../shared/prisma';
import { ICreateExerciseRequest, IUpdateExerciseRequest, IExerciseResponse, IExerciseListResponse } from './exercise.interface';

// Create a new exercise
const createExercise = async (payload: ICreateExerciseRequest): Promise<IExerciseResponse> => {
  // Check if exercise with same name already exists
  const existingExercise = await prisma.exercise.findFirst({
    where: { name: payload.name },
  });

  if (existingExercise) {
    throw new ApiError(httpStatus.CONFLICT, 'Exercise with this name already exists');
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

  const exercise = await prisma.exercise.create({
  data: {
    name: payload.name,
    targetArea: payload.targetArea,
    description: payload.description,
    instructions: payload.instructions,
    difficulty: payload.difficulty,
    categoryId: payload.categoryId,
    videos: {
      connect: payload?.videoIds?.map(id => ({ id })) || [],
    },
  },
  include: {
    videos: true,
  },
});

  return exercise;
};

// Get all exercises with pagination, search, and filters
const getAllExercises = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  categoryId?: string,
  difficulty?: string
): Promise<IExerciseListResponse> => {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { targetArea: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (difficulty) {
    where.difficulty = difficulty;
  }

  const [exercises, total] = await Promise.all([
    prisma.exercise.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        videos:true
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.exercise.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: exercises,
    total,
    page,
    limit,
    totalPages,
  };
};

// Get a specific exercise by ID
const getExerciseById = async (id: string): Promise<IExerciseResponse> => {
  const exercise = await prisma.exercise.findUnique({
    where: { id },
    include: {
      category: true,
      videos: true,
    },
  });

  if (!exercise) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exercise not found');
  }

  return exercise;
};

// Update an exercise
const updateExercise = async (id: string, payload: IUpdateExerciseRequest): Promise<IExerciseResponse> => {
  // Check if exercise exists
  const exercise = await prisma.exercise.findUnique({
    where: { id },
  });

  if (!exercise) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exercise not found');
  }

  // Check if name already exists (excluding current exercise)
  if (payload.name) {
    const existingExercise = await prisma.exercise.findFirst({
      where: {
        name: payload.name,
        NOT: { id },
      },
    });

    if (existingExercise) {
      throw new ApiError(httpStatus.CONFLICT, 'Exercise with this name already exists');
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

  const updatedExercise = await prisma.exercise.update({
    where: { id },
    data: {
      name: payload.name,
      targetArea: payload.targetArea,
      description: payload.description,
      instructions: payload.instructions,
      difficulty: payload.difficulty,
      categoryId: payload.categoryId,
      ...(payload.videoIds && {
        videos: {
          set: payload.videoIds.map(id => ({ id })),
        },
      }),
    },
  });

  return updatedExercise;
};

// Delete an exercise
const deleteExercise = async (id: string): Promise<IExerciseResponse> => {
  const exercise = await prisma.exercise.findUnique({
    where: { id },
  });

  if (!exercise) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Exercise not found');
  }

  const deletedExercise = await prisma.exercise.delete({
    where: { id },
  });

  return deletedExercise;
};

export const exerciseService = {
  createExercise,
  getAllExercises,
  getExerciseById,
  updateExercise,
  deleteExercise,
};
