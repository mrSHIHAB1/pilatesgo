import httpStatus from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import prisma from '../../shared/prisma';

type SubscriptionType = 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAUSED';

const PLAN_DURATIONS: Record<SubscriptionType, number> = {
  WEEKLY: 7,
  MONTHLY: 30,
  YEARLY: 365,
};

const PLAN_PRICES: Record<SubscriptionType, number> = {
  WEEKLY: 0, // Free trial for first-time users
  MONTHLY: 14.99,
  YEARLY: 89.88,
};

/**
 * Initialize subscription plans in the database (run once or periodically)
 */
const initializeSubscriptionPlans = async () => {
  const plans = await prisma.subscriptionPlan.findMany();
  if (plans.length > 0) {
    return plans; // Already initialized
  }

  const newPlans = await Promise.all([
    prisma.subscriptionPlan.create({
      data: {
        type: 'WEEKLY',
        name: 'Weekly Plan - Free Trial',
        description: 'Free 7-day trial for first-time users',
        price: 0,
        durationDays: PLAN_DURATIONS.WEEKLY,
        features: JSON.stringify(['Full app access', '7-day free trial', 'First-time users only']),
        isActive: true,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        type: 'MONTHLY',
        name: 'Monthly Plan',
        description: 'Full access for 30 days',
        price: PLAN_PRICES.MONTHLY,
        durationDays: PLAN_DURATIONS.MONTHLY,
        features: JSON.stringify(['Full app access', '30-day duration', 'Best value']),
        isActive: true,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        type: 'YEARLY',
        name: 'Yearly Plan',
        description: 'Full access for 365 days',
        price: PLAN_PRICES.YEARLY,
        durationDays: PLAN_DURATIONS.YEARLY,
        features: JSON.stringify(['Full app access', '365-day duration', 'Unlimited access']),
        isActive: true,
      },
    }),
  ]);

  return newPlans;
};

/**
 * Purchase a subscription for a user
 * For WEEKLY: Only free if first-time user (no previous subscriptions)
 * For MONTHLY/YEARLY: Standard pricing applies
 */
const purchaseSubscription = async (
  userId: string,
  type: SubscriptionType,
  paymentMethod?: string,
  transactionId?: string
) => {
  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if this is a weekly trial for first-time user
  if (type === 'WEEKLY') {
    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId },
    });

    if (existingSubscription) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Free weekly trial can only be used once. Please upgrade to Monthly or Yearly plan.'
      );
    }
  }

  // Get plan details
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { type },
  });

  if (!plan || !plan.isActive) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subscription plan not found or inactive');
  }

  // Calculate end date
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  // Create subscription
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      type,
      status: 'ACTIVE',
      startDate,
      endDate,
      renewalDate: endDate,
      price: plan.price,
      currency: plan.currency,
      paymentMethod,
      transactionId,
    },
  });

  return subscription;
};

/**
 * Check if user has an active subscription
 */
const hasActiveSubscription = async (userId: string): Promise<boolean> => {
  const now = new Date();
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: {
        gte: now,
      },
    },
  });

  return !!subscription;
};

/**
 * Get user's active subscription
 */
const getUserActiveSubscription = async (userId: string) => {
  const now = new Date();
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: {
        gte: now,
      },
    },
    include: {
      user: {
        select: { id: true, email: true, fullName: true },
      },
    },
    orderBy: { endDate: 'desc' },
  });

  return subscription;
};

/**
 * Get all subscription history for a user
 */
const getUserSubscriptionHistory = async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.subscription.count({ where: { userId } }),
  ]);

  return {
    data: subscriptions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Cancel a subscription
 */
const cancelSubscription = async (userId: string, subscriptionId: string) => {
  // Verify subscription belongs to user
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      userId,
    },
  });

  if (!subscription) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subscription not found');
  }

  if (subscription.status === 'CANCELLED') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Subscription is already cancelled');
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });

  return updated;
};

/**
 * Renew a subscription (extend current active subscription)
 */
const renewSubscription = async (
  userId: string,
  type: SubscriptionType,
  paymentMethod?: string,
  transactionId?: string
) => {
  // Get active subscription
  const active = await getUserActiveSubscription(userId);

  // Deactivate previous subscription if exists
  if (active) {
    await prisma.subscription.update({
      where: { id: active.id },
      data: { status: 'EXPIRED' },
    });
  }

  // Purchase new subscription starting from now
  return purchaseSubscription(userId, type, paymentMethod, transactionId);
};

/**
 * Get all available plans
 */
const getAllPlans = async () => {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { durationDays: 'asc' },
  });

  return plans.map((plan) => ({
    ...plan,
    features: plan.features ? JSON.parse(plan.features) : [],
  }));
};

export const subscriptionService = {
  initializeSubscriptionPlans,
  purchaseSubscription,
  hasActiveSubscription,
  getUserActiveSubscription,
  getUserSubscriptionHistory,
  cancelSubscription,
  renewSubscription,
  getAllPlans,
};
