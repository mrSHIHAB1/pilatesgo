import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import {
  getSubscriptionPlans,
  purchaseSubscription,
  getMyActiveSubscription,
  getMySubscriptionHistory,
  cancelMySubscription,
  renewMySubscription,
} from './subscription.controller';
import {
  purchaseSubscriptionValidation,
  renewSubscriptionValidation,
  cancelSubscriptionValidation,
} from './subscription.validation';

const router = Router();

// Public route - get all subscription plans
router.get('/plans', getSubscriptionPlans);

// Authenticated routes
router.post('/purchase', auth(), validateRequest(purchaseSubscriptionValidation), purchaseSubscription);
router.get('/my-subscription', auth(), getMyActiveSubscription);
router.get('/history', auth(), getMySubscriptionHistory);
router.post('/renew', auth(), validateRequest(renewSubscriptionValidation), renewMySubscription);
router.post('/:subscriptionId/cancel', auth(), validateRequest(cancelSubscriptionValidation), cancelMySubscription);

export const subscriptionRoutes = router;
