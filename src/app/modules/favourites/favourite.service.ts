import httpStatus from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import prisma from '../../shared/prisma';

// Toggle a workout favourite (add if not exists, remove if exists)
const toggleFavourite = async (
  userId: string,
  workoutId: string
): Promise<{ added: boolean }> => {
  // Validate workout exists
  const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!workout) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Workout not found');
  }

  const existing = await prisma.workoutFavourite.findUnique({
    where: { userId_workoutId: { userId, workoutId } },
  });

  if (existing) {
    await prisma.workoutFavourite.delete({
      where: { userId_workoutId: { userId, workoutId } },
    });
    return { added: false };
  }

  await prisma.workoutFavourite.create({
    data: { userId, workoutId },
  });
  return { added: true };
};

// Get all favourites for a user with pagination
const getMyFavourites = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const [favourites, total] = await Promise.all([
    prisma.workoutFavourite.findMany({
      where: { userId },
      skip,
      take: limit,
      include: {
        workout: {
          include: {
            category: true,
            exercises: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.workoutFavourite.count({ where: { userId } }),
  ]);

  return {
    data: favourites.map((f) => ({ ...f.workout, favouritedAt: f.createdAt })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// Check if a specific workout is favourited by user
const isFavourite = async (userId: string, workoutId: string): Promise<boolean> => {
  const existing = await prisma.workoutFavourite.findUnique({
    where: { userId_workoutId: { userId, workoutId } },
  });
  return !!existing;
};

export const favouriteService = {
  toggleFavourite,
  getMyFavourites,
  isFavourite,
};
