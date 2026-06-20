import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { favouriteService } from './favourite.service';

// POST /favourites/toggle/:workoutId
export const toggleFavourite = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as { userId: string }).userId;
  const { workoutId } = req.params as { workoutId: string };

  const result = await favouriteService.toggleFavourite(userId, workoutId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.added ? 'Workout added to favourites' : 'Workout removed from favourites',
    data: result,
  });
});

// GET /favourites/my
export const getMyFavourites = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as { userId: string }).userId;
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  const result = await favouriteService.getMyFavourites(userId, page, limit);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Favourite workouts fetched successfully',
    data: result,
  });
});

// GET /favourites/check/:workoutId
export const checkIsFavourite = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as { userId: string }).userId;
  const { workoutId } = req.params as { workoutId: string };

  const isFavourite = await favouriteService.isFavourite(userId, workoutId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Favourite status fetched successfully',
    data: { isFavourite },
  });
});
