import { z } from 'zod';

export const loginValidation = z.object({
  body: z.object({
    email: z.string({ message: 'Email is required' }).email('Invalid email format'),
    password: z.string({ message: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
  }),
});

export const refreshTokenValidation = z.object({
  body: z.object({
    refreshToken: z.string({ message: 'Refresh token is required' }),
  }),
});

export const forgotPasswordSendOtpValidation = z.object({
  body: z.object({
    email: z.string({ message: 'Email is required' }).email('Invalid email format'),
  }),
});

export const forgotPasswordVerifyOtpValidation = z.object({
  body: z.object({
    email: z.string({ message: 'Email is required' }).email('Invalid email format'),
    otp: z.string({ message: 'OTP is required' }).min(4, 'OTP is required'),
  }),
});

export const forgotPasswordResetPasswordValidation = z.object({
  body: z.object({
    email: z.string({ message: 'Email is required' }).email('Invalid email format'),
    newPassword: z
      .string({ message: 'New password is required' })
      .min(6, 'Password must be at least 6 characters'),
  }),
});
