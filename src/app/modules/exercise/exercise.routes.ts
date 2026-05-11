import { Router } from 'express';
import {
  createExercise,
  getAllExercises,
  getExerciseById,
  updateExercise,
  deleteExercise,
} from './exercise.controller';
import validateRequest from '../../middlewares/validateRequest';
import {
  createExerciseValidation,
  getExerciseValidation,
  getExercisesValidation,
  updateExerciseValidation,
  deleteExerciseValidation,
} from './exercise.validation';

const router = Router();

// POST /exercises - Create a new exercise
router.post('/create', validateRequest(createExerciseValidation), createExercise);

// GET /exercises - Get all exercises with pagination, search, and filters
router.get('/all', validateRequest(getExercisesValidation), getAllExercises);

// GET /exercises/:id - Get a specific exercise by ID
router.get('/by-id/:id', validateRequest(getExerciseValidation), getExerciseById);

// PUT /exercises/:id - Update an exercise
router.put('/update/:id', validateRequest(updateExerciseValidation), updateExercise);

// DELETE /exercises/:id - Delete an exercise
router.delete('/delete/:id', validateRequest(deleteExerciseValidation), deleteExercise);

export const exerciseRoutes = router;
