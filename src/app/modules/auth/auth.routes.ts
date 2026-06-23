import { Router } from 'express';
import {
  login,
  getMe,
  refreshAccessToken,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordResetPassword,
  appleLoginController,
  googleRegister,
  googleCallback,
  googleAuthSystemController,
} from './auth.controller';
import passport from '../../config/passport.config';
import validateRequest from '../../middlewares/validateRequest';
import {
  loginValidation,
  refreshTokenValidation,
  forgotPasswordSendOtpValidation,
  forgotPasswordVerifyOtpValidation,
  forgotPasswordResetPasswordValidation,
} from './auth.validation';
import auth from '../../middlewares/auth';

const router = Router();

// POST /login - User login
router.post('/login',validateRequest(loginValidation),login);

// GET /me - Get current authenticated user
router.get('/me',auth(),getMe);

// POST /refresh-token - Refresh access token
router.post(
  '/refresh-token',
  validateRequest(refreshTokenValidation),
  refreshAccessToken
);

// Forgot password flow
router.post(
  '/forgot-password/send-otp',
  validateRequest(forgotPasswordSendOtpValidation),
  forgotPasswordSendOtp
);

router.post(
  '/forgot-password/verify-otp',
  validateRequest(forgotPasswordVerifyOtpValidation),
  forgotPasswordVerifyOtp
);

router.post(
  '/forgot-password/reset-password',
  validateRequest(forgotPasswordResetPasswordValidation),
  forgotPasswordResetPassword
);
router.post('/login/apple', appleLoginController);
router.get('/google', googleRegister);
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), googleCallback);

// GOOGLE AUTH FOR MOBILE DEVICES
router.post('/google/auth', googleAuthSystemController);

export const authRoutes = router;
