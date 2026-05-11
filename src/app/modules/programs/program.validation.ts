import { z } from 'zod';

export const createProgramValidation = z.object({
  body: z.object({
    title: z.string({ message: 'Program title is required' }).min(1, 'Program title is required'),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], {
      message: 'Difficulty must be BEGINNER, INTERMEDIATE, or ADVANCED',
    }),
    description: z.string().optional(),
    thumbnail: z.string().optional(),
    creatorId: z.string().optional(),
    categoryId: z.string().optional(),
    durationWeeks: z.number().int().positive().optional(),
    coverImage: z.string().optional(),
  }),
});

export const updateProgramValidation = z.object({
  params: z.object({
    id: z.string({ message: 'Program ID is required' }),
  }),
  body: z.object({
    title: z.string().min(1, 'Program title must not be empty').optional(),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    description: z.string().optional(),
    thumbnail: z.string().optional(),
    creatorId: z.string().optional(),
    categoryId: z.string().optional(),
    durationWeeks: z.number().int().positive().optional(),
    coverImage: z.string().optional(),
  }),
});

export const getProgramValidation = z.object({
  params: z.object({
    id: z.string({ message: 'Program ID is required' }),
  }),
});

export const getProgramsValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    creatorId: z.string().optional(),
  }),
});

export const deleteProgramValidation = z.object({
  params: z.object({
    id: z.string({ message: 'Program ID is required' }),
  }),
});
