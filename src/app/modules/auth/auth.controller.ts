import { Request, Response, NextFunction } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
// import { authService, appleLogin, googleAuthSystem } from './auth.service';
import {
  ILoginResponse,
  IGetMeResponse,
  IForgotPasswordSendOtpResponse,
  IForgotPasswordVerifyOtpResponse,
  IForgotPasswordResetPasswordResponse,
} from './auth.interface';
import { setAuthCookie } from '../../../utils/setCookie';
import httpStatus from 'http-status-codes';
import passport from '../../config/passport.config';
import { envVars } from '../../config/env';
import { createUserTokens } from '../../../utils/userTokens';
import { appleLogin, authService, googleAuthSystem } from './auth.service';

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

export const forgotPasswordSendOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.forgotPasswordSendOtp(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'OTP sent (if account exists)',
    data: result,
  });
});

export const forgotPasswordVerifyOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.forgotPasswordVerifyOtp(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'OTP verified successfully',
    data: result,
  });
});

export const forgotPasswordResetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.forgotPasswordResetPassword(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password reset successfully',
    data: result,
  });
});

export const appleLoginController = catchAsync(async (req: Request, res: Response) => {
  const { identityToken } = req.body;

  if (!identityToken) {
    return sendResponse(res, { success: false, statusCode: httpStatus.BAD_REQUEST, message: 'identityToken required', data: null });
  }

  const roleParam = typeof req.body.role === 'string' ? req.body.role : 'USER';

  const result = await appleLogin(identityToken, roleParam);

  if (result && result.accessToken && result.refreshToken) {
    setAuthCookie(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
    return sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Authentication success', data: result });
  }

  return sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Authentication result', data: result });
});

// REGISTER WITH GOOGLE
export const googleRegister = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = {
      redirect: req.query.redirect || '/',
      mobile: req.query.mobile || false
    };

    const state = Buffer
      .from(JSON.stringify(payload))
      .toString('base64');

    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state,
      prompt: 'consent select_account',
    })(req, res, next);
  }
);

// GOOGLE CALLBACK
export const googleCallback = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const state = req.query.state as string;

    const decoded = JSON.parse(
      Buffer.from(state, 'base64').toString()
    );


    if (decoded.redirect.startsWith('/')) {
      decoded.redirect = decoded.redirect.slice(1);
    }

    const user = req.user as any;
    if (!user) return sendResponse(res, { success: false, statusCode: httpStatus.BAD_REQUEST, message: 'User not found', data: null });
    const token = await createUserTokens(user);
    setAuthCookie(res, { accessToken: token.accessToken, refreshToken: token.refreshToken });


    // eslint-disable-next-line no-console
    console.log(token.accessToken);


    if (String(decoded.mobile) === 'true') {
      res.redirect(`${envVars.FRONTEND_URL}/auth/google?access=${token.accessToken}&refresh=${token.refreshToken}`);
    } else {
      res.redirect(`${envVars.FRONTEND_URL}?access=${token.accessToken}`);
    }
  }
);

// GOOGLE AUTHENTICATION SYSTEM FOR MOBILE DEVICES
export const googleAuthSystemController = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const result = await googleAuthSystem(req.body);

  return sendResponse(res, { success: true, statusCode: 200, message: 'Authentication success', data: result });
});

