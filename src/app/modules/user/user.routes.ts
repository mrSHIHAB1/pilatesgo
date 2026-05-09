import { Router } from 'express';
import { createUser, getAllUsers, getUserById, verifytheOtp, completeProfile } from './user.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createUserValidation, getUserValidation, verifyOTPValidation, completeProfileValidation } from './user.validation';

const router = Router();

// Step 1: POST /create-user - Create a new user with email, name, password
router.post(
  '/create-user',
  validateRequest(createUserValidation),
  createUser
);

// Step 2: POST /verify-otp - Verify OTP sent to email
router.post(
  '/verify-otp',
  validateRequest(verifyOTPValidation),
  verifytheOtp
);

// Step 3: POST /complete-profile - Complete user profile after OTP verification
router.post(
  '/complete-profile',
  validateRequest(completeProfileValidation),
  completeProfile
);

// GET /users - Retrieve all user entries
router.get(
  '/users',
  validateRequest(getUserValidation),
  getAllUsers 
);

// GET /users/:id - Retrieve a single user entry
router.get(
  '/users/:id',
  getUserById
);

export const userRoutes = router;
