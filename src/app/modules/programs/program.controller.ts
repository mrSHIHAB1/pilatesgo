import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { programService } from './program.service';

// Create a new program
export const createProgram = catchAsync(async (req: Request, res: Response) => {
  const result = await programService.createProgram(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Program created successfully',
    data: result,
  });
});

// Get all programs
export const getAllPrograms = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const search = req.query.search as string | undefined;
  const categoryId = req.query.categoryId as string | undefined;
  const difficulty = req.query.difficulty as string | undefined;
  const creatorId = req.query.creatorId as string | undefined;

  const result = await programService.getAllPrograms(
    page,
    limit,
    search,
    categoryId,
    difficulty,
    creatorId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Programs fetched successfully',
    data: result,
  });
});

// Get a specific program by ID
export const getProgramById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await programService.getProgramById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Program fetched successfully',
    data: result,
  });
});

// Update a program
export const updateProgram = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await programService.updateProgram(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Program updated successfully',
    data: result,
  });
});

// Delete a program
export const deleteProgram = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await programService.deleteProgram(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Program deleted successfully',
    data: result,
  });
});
