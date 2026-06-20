import { Router } from 'express';
import { toggleFavourite, getMyFavourites, checkIsFavourite } from './favourite.controller';
import auth from '../../middlewares/auth';

const router = Router();

// POST /favourites/toggle/:workoutId — add or remove from favourites
router.post('/toggle/:workoutId', auth(), toggleFavourite);

// GET /favourites/my — get my favourites list (paginated)
router.get('/my', auth(), getMyFavourites);

// GET /favourites/check/:workoutId — check if a workout is favourited
router.get('/check/:workoutId', auth(), checkIsFavourite);

export const favouriteRoutes = router;
