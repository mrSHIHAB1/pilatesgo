import { z } from 'zod';

export const uploadVideoValidation = z.object({
  body: z.object({
    title: z.string({ message: 'Title is required' }).min(1, 'Title is required'),
    description: z.string().optional(),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], {
      message: 'Difficulty must be BEGINNER, INTERMEDIATE, or ADVANCED',
    }),
    visibility: z.enum(['PUBLIC', 'PRIVATE'], {
      message: 'Visibility must be PUBLIC or PRIVATE',
    }),
    categoriesId: z.string().optional(),
  }),
});

export const createVideoValidation = z.object({
  body: z.object({
    title: z.string({ message: 'Title is required' }).min(1, 'Title is required'),
    description: z.string().optional(),
    url: z.string({ message: 'URL is required' }).url('Invalid URL format'),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], {
      message: 'Difficulty must be BEGINNER, INTERMEDIATE, or ADVANCED',
    }),
    visibility: z.enum(['PUBLIC', 'PRIVATE'], {
      message: 'Visibility must be PUBLIC or PRIVATE',
    }),
    duration: z.number().optional(),
    categoriesId: z.string().optional(),
  }),
});

export const updateVideoValidation = z.object({
  params: z.object({
    id: z.string({ message: 'Video ID is required' }),
  }),
  body: z.object({
    title: z.string().min(1, 'Title must not be empty').optional(),
    description: z.string().optional(),
    url: z.string().url('Invalid URL format').optional(),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
    duration: z.number().optional(),
    categoriesId: z.string().optional(),
  }),
});

export const getVideoValidation = z.object({
  params: z.object({
    id: z.string({ message: 'Video ID is required' }),
  }),
});

export const getVideosValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  }),
});

export const deleteVideoValidation = z.object({
  params: z.object({
    id: z.string({ message: 'Video ID is required' }),
  }),
});
