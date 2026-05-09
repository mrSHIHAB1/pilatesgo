import express from 'express';
import { userRoutes } from '../modules/user/user.routes';
import { authRoutes } from '../modules/auth/auth.routes';


const router = express.Router();

const moduleRoutes = [
    {
        path: '/auth',
        route: authRoutes
    },
    {
        path: '/userroute',
        route: userRoutes
    }
      
];
moduleRoutes.forEach(route => router.use(route.path, route.route))
export default router;
