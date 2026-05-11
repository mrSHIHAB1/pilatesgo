import { Router } from 'express';
import {
  createWorkout,
  getAllWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
} from './workout.controller';
import validateRequest from '../../middlewares/validateRequest';
import {
  createWorkoutValidation,
  getWorkoutValidation,
  getWorkoutsValidation,
  updateWorkoutValidation,
  deleteWorkoutValidation,
} from './workout.validation';

const router = Router();

// POST /workouts - Create a new workout
router.post('/', validateRequest(createWorkoutValidation), createWorkout);

// GET /workouts - Get all workouts with pagination, search, and filters
router.get('/', validateRequest(getWorkoutsValidation), getAllWorkouts);

// GET /workouts/:id - Get a specific workout by ID
router.get('/:id', validateRequest(getWorkoutValidation), getWorkoutById);

// PUT /workouts/:id - Update a workout
router.put('/:id', validateRequest(updateWorkoutValidation), updateWorkout);

// DELETE /workouts/:id - Delete a workout
router.delete('/:id', validateRequest(deleteWorkoutValidation), deleteWorkout);

export const workoutRoutes = router;
