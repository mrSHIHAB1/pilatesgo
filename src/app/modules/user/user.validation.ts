import { z } from 'zod';

export const createUserValidation = z.object({
  body: z.object({
    email: z.string({ message: 'Email is required' }).email('Invalid email format'),
    fullName: z.string({ message: 'Full name is required' }).min(2, 'Full name must be at least 2 characters'),
    password: z.string({ message: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
  }),
});

export const verifyOTPValidation = z.object({
  body: z.object({
    email: z.string({ message: 'Email is required' }).email('Invalid email format'),
    otp: z.string({ message: 'OTP is required' }).length(4, 'OTP must be 4 digits'),
  }),
});

export const completeProfileValidation = z.object({
  body: z.object({
    email: z.string({ message: 'Email is required' }).email('Invalid email format'),
    age: z.number({ message: 'Age is required' }).min(1, 'Invalid age'),
    height: z.number({ message: 'Height is required' }).min(0.1, 'Invalid height'),
    weight: z.number({ message: 'Weight is required' }).min(0.1, 'Invalid weight'),
    gender: z.string({ message: 'Gender is required' }).min(1, 'Gender is required'),
    mainGoal: z.string({ message: 'Main goal is required' }).min(1, 'Main goal is required'),
    // Accept both legacy key (familiarity) and new schema key (fimiliarityWithPilates)
    familiarity: z.string().min(1).optional(),
    fimiliarityWithPilates: z.string().min(1).optional(),
    workoutPreference: z.string({ message: 'Workout preference is required' }).min(1, 'Workout preference is required'),
    motivation: z.string({ message: 'Motivation is required' }).min(1, 'Motivation is required'),
    // Accept both legacy key (activity) and new schema key (activeCurrently)
    activity: z.string().min(1).optional(),
    activeCurrently: z.string().min(1).optional(),

    // Accept both legacy key (workoutProblem) and new schema key (likeToWorkOn)
    workoutProblem: z.string().min(1).optional(),
    likeToWorkOn: z.string().min(1).optional(),

    wayOfWorkingOut: z.string().min(1).optional(),
    workoutRoutine: z.string({ message: 'Workout routine is required' }).min(1, 'Workout routine is required'),
  })
  .superRefine((val, ctx) => {
    if (!val.fimiliarityWithPilates && !val.familiarity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['familiarity'],
        message: 'Familiarity is required',
      });
    }

    if (!val.activeCurrently && !val.activity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['activity'],
        message: 'Activity is required',
      });
    }

    if (!val.likeToWorkOn && !val.workoutProblem) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['workoutProblem'],
        message: 'Workout problem is required',
      });
    }
  }),
});

export const getUserValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }).optional(),
});
