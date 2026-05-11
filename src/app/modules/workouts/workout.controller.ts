import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { workoutService } from './workout.service';

// Create a new workout
export const createWorkout = catchAsync(async (req: Request, res: Response) => {
  const result = await workoutService.createWorkout(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Workout created successfully',
    data: result,
  });
});

// Get all workouts
export const getAllWorkouts = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const search = req.query.search as string | undefined;
  const categoryId = req.query.categoryId as string | undefined;
  const difficulty = req.query.difficulty as string | undefined;
  const creatorId = req.query.creatorId as string | undefined;
  const programId = req.query.programId as string | undefined;

  const result = await workoutService.getAllWorkouts(
    page,
    limit,
    search,
    categoryId,
    difficulty,
    creatorId,
    programId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Workouts fetched successfully',
    data: result,
  });
});

// Get a specific workout by ID
export const getWorkoutById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await workoutService.getWorkoutById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Workout fetched successfully',
    data: result,
  });
});

// Update a workout
export const updateWorkout = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await workoutService.updateWorkout(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Workout updated successfully',
    data: result,
  });
});

// Delete a workout
export const deleteWorkout = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await workoutService.deleteWorkout(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Workout deleted successfully',
    data: result,
  });
});
