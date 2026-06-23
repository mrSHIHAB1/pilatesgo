import { z } from 'zod';

export const purchaseSubscriptionValidation = z.object({
  body: z.object({
    type: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY'], {
      message: 'Type must be WEEKLY, MONTHLY, or YEARLY',
    }),
    paymentMethod: z.string().optional(),
    transactionId: z.string().optional(),
  }),
});

export const renewSubscriptionValidation = z.object({
  body: z.object({
    type: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY'], {
      message: 'Type must be WEEKLY, MONTHLY, or YEARLY',
    }),
    paymentMethod: z.string().optional(),
    transactionId: z.string().optional(),
  }),
});

export const cancelSubscriptionValidation = z.object({
  params: z.object({
    subscriptionId: z.string({ message: 'Subscription ID is required' }),
  }),
});
