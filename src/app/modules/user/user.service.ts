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

// Step 1: Create a new user entry with email, name, and password
const createUser = async (payload: ICreateUserRequest): Promise<ICreateUserResponse> => {

  const { email, fullName, password } = payload;
  const otp = generateOTP();
  await storeOTP(email, otp);
  await sendOTPEmail(email, otp, fullName);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.CONFLICT, 'Email already registered');
  }

  // Hash password
  const salt = parseInt(envVars.BCRYPT_SALT_ROUND || '10');
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user with minimal data - profile completion is step 3
  const newUser = await prisma.user.create({
    data: {
      email,
      fullName,
      password: hashedPassword,
      age: 0,
      height: 0,
      weight: 0,
      mainGoal: '',
      familiarity: '',
      workoutPreference: '',
      motivation: '',
      activity: '',
      workoutProblem: '',
      workoutRoutine: '',
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
    workoutPreference, 
    motivation, 
    activity, 
    workoutProblem, 
    workoutRoutine 
  } = payload;

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
      gender,
      mainGoal,
      familiarity,
      workoutPreference,
      motivation,
      activity,
      workoutProblem,
      workoutRoutine,
      isProfileComplete: true,
    },
  });

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    fullName: updatedUser.fullName,
    age: updatedUser.age,
    height: updatedUser.height,
    weight: updatedUser.weight,
    gender: updatedUser.gender || '',
    mainGoal: updatedUser.mainGoal,
    familiarity: updatedUser.familiarity,
    workoutPreference: updatedUser.workoutPreference,
    motivation: updatedUser.motivation,
    activity: updatedUser.activity,
    workoutProblem: updatedUser.workoutProblem,
    workoutRoutine: updatedUser.workoutRoutine,
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
    }),
    prisma.user.count(),
  ]);

  return {
    data: users.map((user) => ({
      id: user.id,
      name: user.fullName || '',
      email: user.email,
      createdAt: user.createdAt,
      isProfileComplete: user.isProfileComplete,
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

export const userService = {
  createUser,
  verifyOTPService,
  completeProfile,
  getAllUsers,
  getUserById,
};