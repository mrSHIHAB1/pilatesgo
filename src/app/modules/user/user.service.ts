import bcrypt from 'bcryptjs';
import httpStatus from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import prisma from '../../shared/prisma';
import { IUserRequest, IUserResponse } from './user.interface';
import { 
  ICreateUserRequest, 
  ICreateUserResponse, 
  IVerifyOTPRequest, 
  IVerifyOTPResponse,
  ICompleteProfileRequest,
  ICompleteProfileResponse 
} from './user.interface';
import { generateOTP, storeOTP, verifyOTP, deleteOTP } from '../../../utils/otpHelper';
import { sendOTPEmail } from '../../helpers/emailHelper';
import { envVars } from '../../config/env';

const ensureProgressDelegates = () => {
  const client = prisma as any;
  if (!client.userProgramExerciseCompletion) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Prisma Client is out of date. Run `prisma generate` and restart the server.'
    );
  }
};

const ensureWeeklyStatsFields = () => {
  const client = prisma as any;
  const userModel = client?._runtimeDataModel?.models?.User;
  const fields: Array<{ name: string }> | undefined = userModel?.fields;
  const hasWeeklyStreak = Array.isArray(fields) && fields.some((f) => f.name === 'weeklyStreak');
  const hasWeeklyTimeSpentSeconds =
    Array.isArray(fields) && fields.some((f) => f.name === 'weeklyTimeSpentSeconds');

  if (!hasWeeklyStreak || !hasWeeklyTimeSpentSeconds) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Prisma Client is out of date (missing weekly stats fields). Run `prisma generate` and restart the server.'
    );
  }
};

const getWeekStartMonday = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 (Sun) .. 6 (Sat)
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const normalizeEnum = <T extends string>(value: string | undefined, allowed: readonly T[]) => {
  if (!value) return null;
  const normalized = value.trim().toUpperCase() as T;
  return allowed.includes(normalized) ? normalized : null;
};

const normalizeWorkoutRoutine = (value: string | undefined) => {
  if (!value) return null;

  // Direct enum values
  const direct = normalizeEnum(value, ['SHORT', 'MEDIUM', 'LONG'] as const);
  if (direct) return direct;

  // Heuristics for common strings like "4 Days per Week"
  const daysMatch = value.match(/(\d+)/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    if (!Number.isNaN(days)) {
      if (days <= 2) return 'SHORT' as const;
      if (days <= 4) return 'MEDIUM' as const;
      return 'LONG' as const;
    }
  }

  return null;
};

const getExerciseDurationSeconds = (exercise: {
  workout?: { duration: number | null } | null;
  videos?: { duration: number | null }[];
}) => {
  const workoutDuration = exercise.workout?.duration ?? null;
  if (typeof workoutDuration === 'number' && workoutDuration > 0) return workoutDuration;

  const durations = (exercise.videos ?? [])
    .map((v) => v.duration)
    .filter((d): d is number => typeof d === 'number' && d > 0);

  if (!durations.length) return 0;
  return Math.max(...durations);
};

// Step 1: Create a new user entry with email, name, and password
const createUser = async (payload: ICreateUserRequest): Promise<ICreateUserResponse> => {

  const { email, fullName, password } = payload;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.CONFLICT, 'Email already registered');
  }
  const otp = generateOTP();
  await storeOTP(email, otp);
  await sendOTPEmail(email, otp, fullName);

  // Hash password
  const salt = parseInt(envVars.BCRYPT_SALT_ROUND || '10');
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user with minimal data - profile completion is step 3
  const newUser = await prisma.user.create({
    data: {
      email,
      fullName,
      password: hashedPassword,
      isProfileComplete: false,
      isVerified: false,
    },
  });

  // Generate and send OTP

  return {
    message: 'User account created. OTP sent to your email.',
    email,
    userId: newUser.id,
  };
};

// Step 2: Verify OTP
const verifyOTPService = async (payload: IVerifyOTPRequest): Promise<IVerifyOTPResponse> => {
  const { email, otp } = payload;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Verify OTP
  const isOTPValid = await verifyOTP(email, otp);

  if (!isOTPValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
  }

  // Mark user as verified
  await prisma.user.update({
    where: { email },
    data: { isVerified: true },
  });

  // Delete OTP from Redis
  await deleteOTP(email);

  return {
    message: 'OTP verified successfully',
    isVerified: true,
    isProfileComplete: user.isProfileComplete,
  };
};

// Step 3: Complete user profile
const completeProfile = async (payload: ICompleteProfileRequest): Promise<ICompleteProfileResponse> => {
  const { 
    email, 
    age, 
    height, 
    weight, 
    gender,
    mainGoal, 
    familiarity,
    fimiliarityWithPilates,
    workoutPreference, 
    motivation, 
    activity,
    activeCurrently,
    workoutProblem,
    likeToWorkOn,
    wayOfWorkingOut,
    workoutRoutine 
  } = payload;

  const normalizedGender = normalizeEnum(gender, ['MALE', 'FEMALE', 'OTHER'] as const);
  if (!normalizedGender) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid gender');
  }

  const normalizedRoutine = normalizeWorkoutRoutine(workoutRoutine);
  if (!normalizedRoutine) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Invalid workout routine. Use SHORT/MEDIUM/LONG or something like "4 Days per Week".'
    );
  }

  const familiarityValue = fimiliarityWithPilates ?? familiarity;
  const activityValue = activeCurrently ?? activity;
  const workoutProblemValue = likeToWorkOn ?? workoutProblem;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if user is verified
  if (!user.isVerified) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Please verify your email first');
  }

  // Update user profile
  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      age,
      height,
      weight,
      gender: normalizedGender,
      mainGoal,
      ...(familiarityValue !== undefined && { fimiliarityWithPilates: familiarityValue }),
      workoutPreference,
      motivation,
      ...(activityValue !== undefined && { activeCurrently: activityValue }),
      ...(workoutProblemValue !== undefined && { likeToWorkOn: workoutProblemValue }),
      ...(wayOfWorkingOut !== undefined && { wayOfWorkingOut }),
      workoutRoutine: normalizedRoutine,
      isProfileComplete: true,
    },
  });

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    fullName: updatedUser.fullName,
    age: updatedUser.age ?? 0,
    height: updatedUser.height,
    weight: updatedUser.weight,
    gender: updatedUser.gender ? String(updatedUser.gender) : '',
    mainGoal: updatedUser.mainGoal ?? '',
    familiarity: updatedUser.fimiliarityWithPilates ?? '',
    workoutPreference: updatedUser.workoutPreference ?? '',
    motivation: updatedUser.motivation ?? '',
    activity: updatedUser.activeCurrently ?? '',
    workoutProblem: updatedUser.likeToWorkOn ?? '',
    workoutRoutine: updatedUser.workoutRoutine ? String(updatedUser.workoutRoutine) : '',
    isVerified: updatedUser.isVerified,
    isProfileComplete: updatedUser.isProfileComplete,
    createdAt: updatedUser.createdAt,
  };
};

// Get all users
const getAllUsers = async (page?: number, limit?: number): Promise<{
  data: IUserResponse[];
  total: number;
}> => {
  const pageNum = page || 1;
  const limitNum = limit || 10;
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limitNum,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: { programCompletions: true }
        }
      }
    }),
    prisma.user.count(),
  ]);

  return {
    data: users.map((user: any) => ({
      id: user.id,
      name: user.fullName || '',
      email: user.email,
      createdAt: user.createdAt,
      isProfileComplete: user.isProfileComplete,
      plan: 'Free', // Add subscriptions later if needed
      status: user.isDeleted ? 'Inactive' : 'Active',
      workouts: user._count?.programCompletions || 0,
      streak: `${user.weeklyStreak || 0}W`,
      avatarBg: 'bg-pink-200', // default
      initials: (user.fullName || 'U').substring(0, 2).toUpperCase(),
    })),
    total,
  };
};

// Get single user
const getUserById = async (id: string): Promise<IUserResponse | null> => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.fullName || '',
    email: user.email,
    createdAt: user.createdAt,
  };
};

const refreshMyWeeklyStats = async (userId: string) => {
  ensureProgressDelegates();
  ensureWeeklyStatsFields();

  const now = new Date();
  const weekStart = getWeekStartMonday(now);
  const weekEnd = addDays(weekStart, 7);

  // Time spent (this week) from completions joined with exercise durations
  const thisWeekCompletions = await prisma.userProgramExerciseCompletion.findMany({
    where: {
      userId,
      completedAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    select: {
      id: true,
      completedAt: true,
      exercise: {
        select: {
          workout: { select: { duration: true } },
          videos: { select: { duration: true } },
        },
      },
    },
  });

  const weeklyTimeSpentSeconds = thisWeekCompletions.reduce((sum, c) => {
    return sum + getExerciseDurationSeconds(c.exercise);
  }, 0);

  const completedExercisesCount = thisWeekCompletions.length;

  // Weekly streak = consecutive weeks (including current week) with >= 1 completion.
  // Limit to the last 54 weeks to keep this fast.
  const lookbackStart = addDays(weekStart, -54 * 7);
  const recentCompletions = await prisma.userProgramExerciseCompletion.findMany({
    where: {
      userId,
      completedAt: {
        gte: lookbackStart,
        lt: weekEnd,
      },
    },
    select: {
      completedAt: true,
    },
  });

  const activeWeeks = new Set<string>();
  for (const c of recentCompletions) {
    const ws = getWeekStartMonday(c.completedAt);
    activeWeeks.add(ws.toISOString());
  }

  let weeklyStreak = 0;
  let cursor = weekStart;
  while (activeWeeks.has(cursor.toISOString())) {
    weeklyStreak += 1;
    cursor = addDays(cursor, -7);
  }

  const updatedAt = new Date();
  await prisma.user.update({
    where: { id: userId },
    data: {
      weeklyStreak,
      weeklyTimeSpentSeconds,
      weeklyStatsWeekStart: weekStart,
      weeklyStatsUpdatedAt: updatedAt,
    },
  });

  return {
    userId,
    weekStart,
    weekEnd,
    weeklyStreak,
    weeklyTimeSpentSeconds,
    weeklyTimeSpentMinutes: Math.round(weeklyTimeSpentSeconds / 60),
    completedExercisesCount,
    updatedAt,
  };
};

const updateUser = async (id: string, payload: any): Promise<any> => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Map "Active" / "Inactive" to isDeleted or a dedicated status field if exists.
  // For now we map "Inactive" to isDeleted = true based on the dashboard logic.
  let updateData = { ...payload };
  if (payload.status === 'Inactive') {
    updateData.isDeleted = true;
    delete updateData.status;
  } else if (payload.status === 'Active') {
    updateData.isDeleted = false;
    delete updateData.status;
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return updatedUser;
};

const deleteUser = async (id: string): Promise<any> => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Soft delete
  return prisma.user.update({
    where: { id },
    data: { isDeleted: true },
  });
};

export const userService = {
  createUser,
  verifyOTPService,
  completeProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  refreshMyWeeklyStats,
};