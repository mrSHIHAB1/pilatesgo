import express from 'express';
import { testRoutes } from '../modules/test/test.routes';

const router = express.Router();

const moduleRoutes = [

    {
        path: '/testroute',
        route: testRoutes
    }
      
];
moduleRoutes.forEach(route => router.use(route.path, route.route))
export default router;
