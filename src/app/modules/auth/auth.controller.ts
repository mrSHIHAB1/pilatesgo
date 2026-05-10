import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { authService } from './auth.service';
import { ILoginResponse, IGetMeResponse } from './auth.interface';
import { setAuthCookie } from '../../../utils/setCookie';

// Login controller
export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);

  // Set tokens in cookies
  setAuthCookie(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged in successfully',
    data: result,
  });
});

// Get current user controller
export const getMe = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({
      statusCode: 401,
      success: false,
      message: 'Unauthorized - User ID not found',
      data: null,
    });
    return;
  }

  const result = await authService.getMe(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

// Refresh token controller
export const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const result = await authService.refreshToken(refreshToken);

  sendResponse<{ accessToken: string }>(res, {
    statusCode: 200,
    success: true,
    message: 'Access token refreshed successfully',
    data: result,
  });
});
