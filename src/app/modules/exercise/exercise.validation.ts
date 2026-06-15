import { z } from 'zod';

export const createExerciseValidation = z.object({
  body: z.object({
    name: z.string({ message: 'Exercise name is required' }).min(1, 'Exercise name is required'),
    targetArea: z.string({ message: 'Target area is required' }).min(1, 'Target area is required'),
    description: z.string().optional(),
    instructions: z.string().optional(),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], {
      message: 'Difficulty must be BEGINNER, INTERMEDIATE, or ADVANCED',
    }),
    categoryId: z.string().optional(),
    videoIds: z.array(z.string()).optional(),
  }),
});

export const updateExerciseValidation = z.object({
  params: z.object({
    id: z.string({ message: 'Exercise ID is required' }),
  }),
  body: z.object({
    name: z.string().min(1, 'Exercise name must not be empty').optional(),
    targetArea: z.string().min(1, 'Target area must not be empty').optional(),
    description: z.string().optional(),
    instructions: z.string().optional(),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    categoryId: z.string().optional(),
    videoIds: z.array(z.string()).optional(),
  }),
});

export const getExerciseValidation = z.object({
  params: z.object({
    id: z.string({ message: 'Exercise ID is required' }),
  }),
});

export const getExercisesValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  }),
});

export const deleteExerciseValidation = z.object({
  params: z.object({
    id: z.string({ message: 'Exercise ID is required' }),
  }),
});
