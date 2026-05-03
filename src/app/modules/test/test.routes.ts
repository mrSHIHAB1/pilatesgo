import { Router } from 'express';
import { createTest, getAllTests, getTestById } from './test.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createTestValidation, getTestValidation } from './test.validation';

const router = Router();

// POST /test - Create a new test entry
router.post(
  '/test',
  validateRequest(createTestValidation),
  createTest
);

// GET /test - Retrieve all test entries
router.get(
  '/test',
  validateRequest(getTestValidation),
  getAllTests
);

// GET /test/:id - Retrieve a single test entry
router.get(
  '/test/:id',
  getTestById
);

export const testRoutes = router;
