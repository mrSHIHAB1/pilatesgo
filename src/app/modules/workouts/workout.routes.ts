import { Router } from 'express';
import {
  createWorkout,
  getAllWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
  getWorkoutCategoryStats,
  getCategoryWiseWorkouts 
} from './workout.controller';
import validateRequest from '../../middlewares/validateRequest';
import {
  createWorkoutValidation,
  getWorkoutValidation,
  getWorkoutsValidation,
  updateWorkoutValidation,
  deleteWorkoutValidation,
} from './workout.validation';
import auth from '../../middlewares/auth';

const router = Router();

// POST /workouts - Create a new workout
router.post('/create', auth(), validateRequest(createWorkoutValidation), createWorkout);

// GET /workouts - Get all workouts with pagination, search, and filters
router.get('/all', auth(), getAllWorkouts);

// GET /workouts/:id - Get a specific workout by ID
router.get('/by-id/:id', auth(),  getWorkoutById);

// PUT /workouts/:id - Update a workout
router.put('/update/:id', auth(), validateRequest(updateWorkoutValidation), updateWorkout);

// DELETE /workouts/:id - Delete a workout
router.delete('/delete/:id', auth(), validateRequest(deleteWorkoutValidation), deleteWorkout);
// GET /workouts/stats - Get workout category statistics
router.get('/category-stats',auth(),getWorkoutCategoryStats);
router.get('/category-wise',auth(),getCategoryWiseWorkouts);
export const workoutRoutes = router;
