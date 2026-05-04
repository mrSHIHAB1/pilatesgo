import { ITestRequest, ITestResponse } from './user.interface';
import prisma from '../../shared/prisma';

export const testService = {
  // Create a new test entry (save to database)
  createTest: async (payload: ITestRequest): Promise<ITestResponse> => {
    const newUser = await prisma.user.create({
      data: {
        email: payload.email,
        name: payload.name,
      },
    });

    return {
      id: newUser.id,
      name: newUser.name || '',
      email: newUser.email,
      createdAt: newUser.createdAt,
    };
  },

  // Get all test entries from database
  getAllTests: async (page?: number, limit?: number): Promise<{
    data: ITestResponse[];
    total: number;
  }> => {
    const pageNum = page || 1;
    const limitNum = limit || 10;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return {
      data: users.map(user => ({
        id: user.id,
        name: user.name || '',
        email: user.email,
        createdAt: user.createdAt,
      })),
      total,
    };
  },

  // Get a single test entry by ID from database
  getTestById: async (id: string): Promise<ITestResponse | null> => {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name || '',
      email: user.email,
      createdAt: user.createdAt,
    };
  },
};
