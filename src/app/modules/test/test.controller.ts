import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { testService } from './test.service';
import { ITestResponse } from './test.interface';

// POST handler - Create a new test entry
export const createTest = catchAsync(async (req: Request, res: Response) => {
  const { name, email } = req.body;

  const result = await testService.createTest({
    name,
    email,
  });

  sendResponse<ITestResponse>(res, {
    statusCode: 201,
    success: true,
    message: 'Test entry created successfully',
    data: result,
  });
});

// GET handler - Retrieve all test entries
export const getAllTests = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  const result = await testService.getAllTests(page, limit);

  sendResponse<ITestResponse[]>(res, {
    statusCode: 200,
    success: true,
    message: 'Test entries retrieved successfully',
    meta: {
      page: page,
      limit: limit,
      total: result.total,
    },
    data: result.data,
  });
});

// GET handler - Retrieve a single test entry by ID
export const getTestById = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const result = await testService.getTestById(id);

  if (!result) {
    sendResponse<null>(res, {
      statusCode: 404,
      success: false,
      message: 'Test entry not found',
      data: null,
    });
    return;
  }

  sendResponse<ITestResponse>(res, {
    statusCode: 200,
    success: true,
    message: 'Test entry retrieved successfully',
    data: result,
  });
});
