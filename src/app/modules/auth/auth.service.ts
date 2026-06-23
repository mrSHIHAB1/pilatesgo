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
import { createRemoteJWKSet, jwtVerify } from 'jose';
import axios from 'axios';
import { verifyAppleToken } from '../../../utils/appleVerify';

export const authService = {
  // Login - Authenticate user with email and password
  login: async (payload: ILoginRequest): Promise<ILoginResponse> => {
    const { email, password } = payload;

    const user = await prisma.user.findUnique({ where: { email }, include: { authProviders: true } });
    if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
    if (user.isDeleted) throw new ApiError(httpStatus.FORBIDDEN, 'This user account has been deleted');

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      // If the account is linked to an external provider, guide user to use OAuth or reset password
      if (user.authProviders && user.authProviders.length > 0) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          'This account is linked to an external provider (Google/Apple). Please sign in with the provider or reset your password.'
        );
      }

      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
    }

    const userResponse = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
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

    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

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
    if (!isValid) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');

    // Consume OTP and allow password reset for a short window
    await deleteOTP(email);
    await markOTPVerified(email);

    return { message: 'OTP verified successfully', isVerified: true };
  },

  // Step 3: Reset password after OTP verification
  forgotPasswordResetPassword: async (
    payload: IForgotPasswordResetPasswordRequest
  ): Promise<IForgotPasswordResetPasswordResponse> => {
    const { email, newPassword } = payload;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.isDeleted) throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to reset password');

    const verified = await isOTPVerified(email);
    if (!verified) throw new ApiError(httpStatus.FORBIDDEN, 'OTP verification required');

    const salt = parseInt(envVars.BCRYPT_SALT_ROUND || '10');
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({ where: { email }, data: { password: hashedPassword } });

    await clearOTPVerified(email);

    return { message: 'Password reset successfully' };
  },
};

// --- OAuth helpers and implementations ---
const createOAuthPassword = async (seed: string) => {
  const rounds = parseInt(envVars.BCRYPT_SALT_ROUND || '10', 10);
  return bcrypt.hash(`oauth:${seed}:${Date.now()}`, rounds);
};

const googleJWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export const appleLogin = async (identityToken: string, role: string = 'USER') => {
  if (!identityToken) throw new ApiError(httpStatus.BAD_REQUEST, 'Apple identity token required');

  const appleUser: any = await verifyAppleToken(identityToken);
  const appleId = appleUser?.sub;
  const email = appleUser?.email?.toLowerCase?.();

  if (!appleId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid Apple token');

  // Find by auth provider
  let user = await prisma.user.findFirst({ where: { authProviders: { some: { provider: 'APPLE', providerId: appleId } } }, include: { authProviders: true } });

  if (!user && email) {
    user = await prisma.user.findUnique({ where: { email }, include: { authProviders: true } });
  }

  if (!user) {
    const password = await createOAuthPassword(`apple:${appleId}`);
    user = await prisma.user.create({
      data: {
        email: email ?? '',
        password,
        fullName: appleUser?.name ?? 'Apple User',
        role: role as any,
        isVerified: true,
        authProviders: { create: { provider: 'APPLE', providerId: appleId } },
      },
      include: { authProviders: true },
    });
  } else {
    const hasApple = user.authProviders?.some((p) => p.provider === 'APPLE' && p.providerId === appleId);
    if (!hasApple) {
      await prisma.authProvider.create({ data: { provider: 'APPLE', providerId: appleId, userId: user.id } });
      await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
    }
  }

  if (user.isDeleted) throw new ApiError(httpStatus.BAD_REQUEST, 'User was deleted!');

  const tokens = createUserTokens({ id: user.id, email: user.email, name: user.fullName });

  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user };
};

export const googleAuthSystem = async (payload: any) => {
  if (!payload || typeof payload !== 'object') throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Google auth payload');

  const idToken = typeof payload?.id_token === 'string' ? payload.id_token.trim() : '';
  const accessToken = typeof payload?.access_token === 'string' ? payload.access_token.trim() : '';

  if (!idToken) throw new ApiError(httpStatus.BAD_REQUEST, 'Google id_token is required');

  let verifiedGooglePayload: any;
  try {
    const { payload: vp } = await jwtVerify(idToken, googleJWKS, { issuer: ['https://accounts.google.com', 'accounts.google.com'] });
    verifiedGooglePayload = vp;
  } catch (error: any) {
    const reason = envVars.NODE_ENV === 'development' && error?.message ? `: ${error.message}` : '';
    throw new ApiError(httpStatus.UNAUTHORIZED, `Invalid Google id_token${reason}`);
  }

  const googleUserId = typeof verifiedGooglePayload.sub === 'string' ? verifiedGooglePayload.sub.trim() : '';
  const verifiedEmail = typeof verifiedGooglePayload.email === 'string' ? verifiedGooglePayload.email.toLowerCase().trim() : '';

  if (!googleUserId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Google user id not found in token');
  if (!verifiedEmail || verifiedGooglePayload.email_verified !== true) throw new ApiError(httpStatus.UNAUTHORIZED, 'Google email is not verified');

  // optional: validate access_token userinfo
  if (accessToken) {
    try {
      const { data: googleUserInfo } = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
      const accessTokenSub = typeof googleUserInfo?.sub === 'string' ? googleUserInfo.sub.trim() : '';
      const accessTokenEmail = typeof googleUserInfo?.email === 'string' ? googleUserInfo.email.toLowerCase().trim() : '';
      if (!accessTokenSub || accessTokenSub !== googleUserId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Google token mismatch');
      if (accessTokenEmail && accessTokenEmail !== verifiedEmail) throw new ApiError(httpStatus.UNAUTHORIZED, 'Google token email mismatch');
      if (googleUserInfo.email_verified === false) throw new ApiError(httpStatus.UNAUTHORIZED, 'Google access token email is not verified');
    } catch (error) {
      if (axios.isAxiosError(error)) throw new ApiError(httpStatus.UNAUTHORIZED, 'Google access_token validation failed');
      throw error;
    }
  }

  const fallbackName = (verifiedEmail.split('@')[0]) || 'Google User';
  const providerName = typeof verifiedGooglePayload.name === 'string' ? verifiedGooglePayload.name.trim() : '';
  const userName = providerName || (typeof payload?.name === 'string' ? payload.name.trim() : '') || fallbackName;

  // find user by auth provider
  let user = await prisma.user.findFirst({ where: { authProviders: { some: { provider: 'GOOGLE', providerId: googleUserId } } }, include: { authProviders: true } });
  if (!user) {
    user = verifiedEmail ? await prisma.user.findUnique({ where: { email: verifiedEmail }, include: { authProviders: true } }) : null;
  }

  if (!user) {
    const password = await createOAuthPassword(`google:${googleUserId}`);
    user = await prisma.user.create({
      data: {
        email: verifiedEmail,
        password,
        fullName: userName,
        role: 'USER',
        isVerified: true,
        authProviders: { create: { provider: 'GOOGLE', providerId: googleUserId } },
      },
      include: { authProviders: true },
    });
  } else {
    const hasGoogle = user.authProviders?.some((p) => p.provider === 'GOOGLE' && p.providerId === googleUserId);
    if (!hasGoogle) {
      await prisma.authProvider.create({ data: { provider: 'GOOGLE', providerId: googleUserId, userId: user.id } });
    }
  }

  if (!user) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Authentication failed');
  if (user.isDeleted) throw new ApiError(httpStatus.BAD_REQUEST, 'User was deleted!');

  const tokens = createUserTokens({ id: user.id, email: user.email, name: user.fullName });

  // attach for backwards compatibility
  (authService as any).appleLogin = appleLogin;
  (authService as any).googleAuthSystem = googleAuthSystem;

  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user };
};
