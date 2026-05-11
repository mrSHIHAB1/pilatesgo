import { z } from 'zod';

export const createCategoryValidation = z.object({
  body: z.object({
    name: z.string({ message: 'Category name is required' }).min(1, 'Category name is required'),
    description: z.string().optional(),
  }),
});

export const updateCategoryValidation = z.object({
  params: z.object({
    id: z.string({ message: 'Category ID is required' }),
  }),
  body: z.object({
    name: z.string().min(1, 'Category name must not be empty').optional(),
    description: z.string().optional(),
  }),
});

export const getCategoryValidation = z.object({
  params: z.object({
    id: z.string({ message: 'Category ID is required' }),
  }),
});

export const getCategoriesValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const deleteCategoryValidation = z.object({
  params: z.object({
    id: z.string({ message: 'Category ID is required' }),
  }),
});
