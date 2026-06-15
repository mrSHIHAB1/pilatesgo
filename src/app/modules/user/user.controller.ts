import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { userService } from './user.service';
import { 
  ICreateUserResponse, 
  IVerifyOTPResponse, 
  ICompleteProfileResponse,
  IWeeklyStatsResponse 
} from './user.interface';

// Step 1: POST handler - Create a new user entry with email, name, and password
export const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createUser(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User account created. Please check your email for OTP.',
    data: result,
  });
});

// Step 2: POST handler - Verify OTP
export const verifytheOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.verifyOTPService(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Email verified successfully. You can now complete your profile.',
    data: result,
  });
});

// Step 3: POST handler - Complete user profile
export const completeProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.completeProfile(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile completed successfully',
    data: result,
  });
});

// GET handler - Retrieve all user entries
export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  const result = await userService.getAllUsers(page, limit);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User entries retrieved successfully',
    meta: {
      page: page,
      limit: limit,
      total: result.total,
    },
    data: result.data,
  });
});

// GET handler - Retrieve a single user entry by ID
export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const result = await userService.getUserById(id);

  if (!result) {
    sendResponse(res, {
      statusCode: 404,
      success: false,
      message: 'User entry not found',
      data: null,
    });
    return;
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User entry retrieved successfully',
    data: result,
  });
});

// PUT handler - Update a single user entry by ID
export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const result = await userService.updateUser(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User entry updated successfully',
    data: result,
  });
});

// DELETE handler - Delete a single user entry by ID
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const result = await userService.deleteUser(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User entry deleted successfully',
    data: result,
  });
});

// GET handler - Refresh + retrieve my weekly stats (streak + time spent)
export const getMyWeeklyStats = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'You are not authorized!',
      data: null,
    });
    return;
  }

  const result = await userService.refreshMyWeeklyStats(userId);

  sendResponse<IWeeklyStatsResponse>(res, {
    statusCode: 200,
    success: true,
    message: 'Weekly stats retrieved successfully',
    data: result,
  });
});
