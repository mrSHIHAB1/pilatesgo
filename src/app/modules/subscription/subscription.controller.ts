import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { subscriptionService } from './subscription.service';

// GET all available subscription plans
export const getSubscriptionPlans = catchAsync(async (req: Request, res: Response) => {
  const plans = await subscriptionService.getAllPlans();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription plans retrieved successfully',
    data: plans,
  });
});

// POST purchase a subscription
export const purchaseSubscription = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId as string | undefined;

  if (!userId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const { type, paymentMethod, transactionId } = req.body;

  const subscription = await subscriptionService.purchaseSubscription(userId, type, paymentMethod, transactionId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Subscription purchased successfully',
    data: subscription,
  });
});

// GET user's active subscription
export const getMyActiveSubscription = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId as string | undefined;

  if (!userId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const subscription = await subscriptionService.getUserActiveSubscription(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: subscription ? 'Active subscription found' : 'No active subscription',
    data: subscription,
  });
});

// GET user's subscription history
export const getMySubscriptionHistory = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId as string | undefined;

  if (!userId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  const result = await subscriptionService.getUserSubscriptionHistory(userId, page, limit);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription history retrieved successfully',
    data: result.data,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
    },
  });
});

// POST cancel subscription
export const cancelMySubscription = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId as string | undefined;

  if (!userId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const { subscriptionId } = req.params as { subscriptionId: string };

  const subscription = await subscriptionService.cancelSubscription(userId, subscriptionId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription cancelled successfully',
    data: subscription,
  });
});

// POST renew subscription
export const renewMySubscription = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId as string | undefined;

  if (!userId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const { type, paymentMethod, transactionId } = req.body;

  const subscription = await subscriptionService.renewSubscription(userId, type, paymentMethod, transactionId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Subscription renewed successfully',
    data: subscription,
  });
});
