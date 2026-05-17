import bcrypt from 'bcryptjs';
import httpStatus from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import prisma from '../../shared/prisma';
import {
  ILoginRequest,
  ILoginResponse,
  IGetMeResponse,
  IForgotPasswordSendOtpRequest,
  IForgotPasswordSendOtpResponse,
  IForgotPasswordVerifyOtpRequest,
  IForgotPasswordVerifyOtpResponse,
  IForgotPasswordResetPasswordRequest,
  IForgotPasswordResetPasswordResponse,
} from './auth.interface';
import { createUserTokens, createNewAccessTokenWithRefreshToken } from '../../../utils/userTokens';
import {
  generateOTP,
  storeOTP,
  verifyOTP,
  deleteOTP,
  markOTPVerified,
  isOTPVerified,
  clearOTPVerified,
} from '../../../utils/otpHelper';
import { sendForgotPasswordOTPEmail } from '../../helpers/emailHelper';
import { envVars } from '../../config/env';

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
        workoutPreference: true,
        motivation: true,
        workoutRoutine: true,
        fimiliarityWithPilates: true,
        activeCurrently: true,
        likeToWorkOn: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      age: user.age ?? 0,
      height: user.height,
      weight: user.weight,
      mainGoal: user.mainGoal ?? '',
      familiarity: user.fimiliarityWithPilates ?? '',
      workoutPreference: user.workoutPreference ?? '',
      motivation: user.motivation ?? '',
      activity: user.activeCurrently ?? '',
      workoutProblem: user.likeToWorkOn ?? '',
      workoutRoutine: user.workoutRoutine ? String(user.workoutRoutine) : '',
      role: String(user.role),
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const accessToken = await createNewAccessTokenWithRefreshToken(refreshToken);
    return { accessToken };
  },

  // Step 1: Send OTP for forgot password
  forgotPasswordSendOtp: async (
    payload: IForgotPasswordSendOtpRequest
  ): Promise<IForgotPasswordSendOtpResponse> => {
    const { email } = payload;

    const user = await prisma.user.findUnique({ where: { email } });

    // Do not reveal whether the account exists
    if (!user || user.isDeleted) {
      return { message: 'If an account exists for this email, an OTP has been sent.' };
    }

    const otp = generateOTP();
    await storeOTP(email, otp);
    await sendForgotPasswordOTPEmail(email, otp, user.fullName || '');

    return { message: 'If an account exists for this email, an OTP has been sent.' };
  },

  // Step 2: Verify OTP for forgot password
  forgotPasswordVerifyOtp: async (
    payload: IForgotPasswordVerifyOtpRequest
  ): Promise<IForgotPasswordVerifyOtpResponse> => {
    const { email, otp } = payload;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.isDeleted) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
    }

    const isValid = await verifyOTP(email, otp);
    if (!isValid) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
    }

    // Consume OTP and allow password reset for a short window
    await deleteOTP(email);
    await markOTPVerified(email);

    return {
      message: 'OTP verified successfully',
      isVerified: true,
    };
  },

  // Step 3: Reset password after OTP verification
  forgotPasswordResetPassword: async (
    payload: IForgotPasswordResetPasswordRequest
  ): Promise<IForgotPasswordResetPasswordResponse> => {
    const { email, newPassword } = payload;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.isDeleted) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to reset password');
    }

    const verified = await isOTPVerified(email);
    if (!verified) {
      throw new ApiError(httpStatus.FORBIDDEN, 'OTP verification required');
    }

    const salt = parseInt(envVars.BCRYPT_SALT_ROUND || '10');
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });

    await clearOTPVerified(email);

    return { message: 'Password reset successfully' };
  },
};
