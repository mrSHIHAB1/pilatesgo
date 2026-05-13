export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface IGetMeResponse {
  id: string;
  email: string;
  fullName: string;
  age: number;
  height: number;
  weight: number;
  mainGoal: string;
  familiarity: string;
  workoutPreference: string;
  motivation: string;
  activity: string;
  workoutProblem: string;
  workoutRoutine: string;
  role: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface IForgotPasswordSendOtpRequest {
  email: string;
}

export interface IForgotPasswordVerifyOtpRequest {
  email: string;
  otp: string;
}

export interface IForgotPasswordResetPasswordRequest {
  email: string;
  newPassword: string;
}

export interface IForgotPasswordSendOtpResponse {
  message: string;
}

export interface IForgotPasswordVerifyOtpResponse {
  message: string;
  isVerified: boolean;
}

export interface IForgotPasswordResetPasswordResponse {
  message: string;
}
