import { is } from "zod/v4/locales";

export interface IUserRequest {
  name: string;
  email: string;
}

export interface IUserResponse {
  id: string;
  name: string;
  email: string;
  createdAt?: Date;
}

// Step 1: Create User Registration
export interface ICreateUserRequest {
  email: string;
  fullName: string;
  password: string;
}

export interface ICreateUserResponse {
  message: string;
  email: string;
  userId?: string;
}

// Step 2: Verify OTP
export interface IVerifyOTPRequest {
  email: string;
  otp: string;
}

export interface IVerifyOTPResponse {
  message: string;
  isVerified: boolean;
  isProfileComplete?: boolean;
}

// Step 3: Complete Profile
export interface ICompleteProfileRequest {
  email: string;
  age: number;
  height: number;
  weight: number;
  gender: string;
  mainGoal: string;
  familiarity: string;
  workoutPreference: string;
  motivation: string;
  activity: string;
  isProfileComplete?: boolean;
  workoutProblem: string;
  workoutRoutine: string;
}

export interface ICompleteProfileResponse {
  id: string;
  email: string;
  fullName: string;
  age: number;
  height: number;
  weight: number;
  gender: string;
  mainGoal: string;
  familiarity: string;
  workoutPreference: string;
  motivation: string;
  activity: string;
  workoutProblem: string;
  workoutRoutine: string;
  isProfileComplete: boolean;
  isVerified: boolean;
  createdAt: Date;
}

// Old interface (kept for backward compatibility)
export interface ITestResponse {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
