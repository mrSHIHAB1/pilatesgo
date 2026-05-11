import httpStatus from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import prisma from '../../shared/prisma';
import { ICreateCategoryRequest, IUpdateCategoryRequest, ICategoryResponse, ICategoryListResponse } from './category.interface';

// Create a new category
const createCategory = async (payload: ICreateCategoryRequest): Promise<ICategoryResponse> => {
  // Check if category with same name already exists
  const existingCategory = await prisma.category.findUnique({
    where: { name: payload.name },
  });

  if (existingCategory) {
    throw new ApiError(httpStatus.CONFLICT, 'Category with this name already exists');
  }

  const category = await prisma.category.create({
    data: {
      name: payload.name,
      description: payload.description,
    },
  });

  return category;
};

// Get all categories with pagination and search
const getAllCategories = async (
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<ICategoryListResponse> => {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: categories,
    total,
    page,
    limit,
    totalPages,
  };
};

// Get a specific category by ID
const getCategoryById = async (id: string): Promise<ICategoryResponse> => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  return category;
};

// Update a category
const updateCategory = async (id: string, payload: Partial<ICreateCategoryRequest>): Promise<ICategoryResponse> => {
  // Check if category exists
  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  // Check if new name already exists (if updating name)
  if (payload.name && payload.name !== existingCategory.name) {
    const nameExists = await prisma.category.findUnique({
      where: { name: payload.name },
    });

    if (nameExists) {
      throw new ApiError(httpStatus.CONFLICT, 'Category with this name already exists');
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: {
      ...(payload.name && { name: payload.name }),
      ...(payload.description !== undefined && { description: payload.description }),
    },
  });

  return updatedCategory;
};

// Delete a category
const deleteCategory = async (id: string): Promise<void> => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  await prisma.category.delete({
    where: { id },
  });
};

export const categoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
