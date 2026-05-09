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
