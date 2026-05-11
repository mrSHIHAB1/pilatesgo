import { z } from 'zod';

export const createWorkoutValidation = z.object({
  body: z.object({
    title: z.string({ message: 'Workout title is required' }).min(1, 'Workout title is required'),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], {
      message: 'Difficulty must be BEGINNER, INTERMEDIATE, or ADVANCED',
    }),
    description: z.string().optional(),
    duration: z.number().int().positive().optional(),
    categoryId: z.string().optional(),
    creatorId: z.string().optional(),
    programId: z.string().optional(),
  }),
});

export const updateWorkoutValidation = z.object({
  params: z.object({
    id: z.string({ message: 'Workout ID is required' }),
  }),
  body: z.object({
    title: z.string().min(1, 'Workout title must not be empty').optional(),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    description: z.string().optional(),
    duration: z.number().int().positive().optional(),
    categoryId: z.string().optional(),
    creatorId: z.string().optional(),
    programId: z.string().optional(),
  }),
});

export const getWorkoutValidation = z.object({
  params: z.object({
    id: z.string({ message: 'Workout ID is required' }),
  }),
});

export const getWorkoutsValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    creatorId: z.string().optional(),
    programId: z.string().optional(),
  }),
});

export const deleteWorkoutValidation = z.object({
  params: z.object({
    id: z.string({ message: 'Workout ID is required' }),
  }),
});
