import { Router } from 'express';
import { login, getMe, refreshAccessToken } from './auth.controller';
import validateRequest from '../../middlewares/validateRequest';
import { loginValidation, refreshTokenValidation } from './auth.validation';
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

export const authRoutes = router;
