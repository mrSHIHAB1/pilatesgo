import bcrypt from 'bcryptjs';
import httpStatus from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import prisma from '../../shared/prisma';
import { ILoginRequest, ILoginResponse, IGetMeResponse } from './auth.interface';
import { createUserTokens, createNewAccessTokenWithRefreshToken } from '../../../utils/userTokens';

export const authService = {
  // Login - Authenticate user with email and password
  login: async (payload: ILoginRequest): Promise<ILoginResponse> => {
    const { email, password } = payload;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
    }

    // Check if user is deleted
    if (user.isDeleted) {
      throw new ApiError(httpStatus.FORBIDDEN, 'This user account has been deleted');
    }

    // Compare passwords
    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
    }

    // Generate tokens
    const userResponse = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    };

    const tokens = createUserTokens(userResponse);

    return {
      ...tokens,
      user: userResponse,
    };
  },

  // Get current authenticated user
  getMe: async (userId: string): Promise<IGetMeResponse> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        age: true,
        height: true,
        weight: true,
        mainGoal: true,
        familiarity: true,
        workoutPreference: true,
        motivation: true,
        activity: true,
        workoutProblem: true,
        workoutRoutine: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    return user as IGetMeResponse;
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const accessToken = await createNewAccessTokenWithRefreshToken(refreshToken);
    return { accessToken };
  },
};
