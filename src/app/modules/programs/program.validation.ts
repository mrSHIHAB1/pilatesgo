import { z } from 'zod';

// For form-data requests, we need a lenient validation that allows any fields
export const createProgramValidation = z.object({
  body: z.any(),
});


export const updateProgramValidation = z.object({
  params: z.object({
    id: z.string({ message: 'Program ID is required' }),
  }),
  body: z.any(),
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

export const activateProgramValidation = z.object({
  params: z.object({
    programId: z.string({ message: 'Program ID is required' }),
  }),
});

export const getProgramProgressValidation = z.object({
  params: z.object({
    programId: z.string({ message: 'Program ID is required' }),
  }),
});

export const setExerciseDoneValidation = z.object({
  params: z.object({
    programId: z.string({ message: 'Program ID is required' }),
    programWeekId: z.string({ message: 'Program Week ID is required' }),
    programDayId: z.string({ message: 'Program Day ID is required' }),
  }),
  body: z
    .object({
      exerciseId: z.string({ message: 'exerciseId is required' }),
      done: z.boolean({ message: 'done must be boolean' }).optional(),
    }),
});
