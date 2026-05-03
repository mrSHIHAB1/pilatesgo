import { z } from 'zod';

export const createTestValidation = z.object({
  body: z.object({
    name: z.string({ message: 'Name is required' }).min(1, 'Name cannot be empty'),
    email: z.string({ message: 'Email is required' }).email('Invalid email format'),
  }),
});

export const getTestValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }).optional(),
});
