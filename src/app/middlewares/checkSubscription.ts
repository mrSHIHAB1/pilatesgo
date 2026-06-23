import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status-codes';
import ApiError from '../errors/ApiError';
import { subscriptionService } from '../modules/subscription/subscription.service';

/**
 * Middleware to check if user has active subscription
 * Attach to protected routes that require subscription
 */
export const checkSubscription = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    // Check if user has active subscription
    const hasSubscription = await subscriptionService.hasActiveSubscription(userId);

    if (!hasSubscription) {
      throw new ApiError(
        httpStatus.PAYMENT_REQUIRED,
        'No active subscription found. Please purchase a subscription to access this feature.'
      );
    }

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: {},
      });
    }

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Subscription check failed',
      error: {},
    });
  }
};

/**
 * Optional: Attach active subscription info to request
 */
export const attachSubscriptionInfo = async (req: Request & { user?: any; subscription?: any }, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (userId) {
      const subscription = await subscriptionService.getUserActiveSubscription(userId);
      req.subscription = subscription;
    }

    next();
  } catch (error) {
    // Continue without subscription info - not critical
    next();
  }
};
