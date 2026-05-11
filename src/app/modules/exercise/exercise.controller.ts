import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { exerciseService } from './exercise.service';

// Create a new exercise
export const createExercise = catchAsync(async (req: Request, res: Response) => {
  const result = await exerciseService.createExercise(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Exercise created successfully',
    data: result,
  });
});

// Get all exercises
export const getAllExercises = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const search = req.query.search as string | undefined;
  const categoryId = req.query.categoryId as string | undefined;
  const difficulty = req.query.difficulty as string | undefined;

  const result = await exerciseService.getAllExercises(page, limit, search, categoryId, difficulty);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exercises fetched successfully',
    data: result,
  });
});

// Get a specific exercise by ID
export const getExerciseById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await exerciseService.getExerciseById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exercise fetched successfully',
    data: result,
  });
});

// Update an exercise
export const updateExercise = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await exerciseService.updateExercise(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exercise updated successfully',
    data: result,
  });
});

// Delete an exercise
export const deleteExercise = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await exerciseService.deleteExercise(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exercise deleted successfully',
    data: result,
  });
});
