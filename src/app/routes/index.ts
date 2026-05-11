import express from 'express';
import { userRoutes } from '../modules/user/user.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { videoRoutes } from '../modules/video/video.routes';
import { categoryRoutes } from '../modules/categories/category.routes';
import { exerciseRoutes } from '../modules/exercise/exercise.routes';
import { workoutRoutes } from '../modules/workouts/workout.routes';
import { programRoutes } from '../modules/programs/program.routes';


const router = express.Router();

const moduleRoutes = [
    {
        path: '/auth',
        route: authRoutes
    },
    {
        path: '/userroute',
        route: userRoutes
    },
    {
        path: '/videos',
        route: videoRoutes
    },
    {
        path: '/categories',
        route: categoryRoutes
    },
    {
        path: '/exercises',
        route: exerciseRoutes
    },
    {
        path: '/workouts',
        route: workoutRoutes
    },
    {
        path: '/programs',
        route: programRoutes
    }
      
];
moduleRoutes.forEach(route => router.use(route.path, route.route))
export default router;
