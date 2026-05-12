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
