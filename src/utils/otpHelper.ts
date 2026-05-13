import { redisClient } from '../app/config/redis.config';

const OTP_EXPIRY = 600; // 10 minutes in seconds

// Generate a random 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in Redis with email as key
export const storeOTP = async (email: string, otp: string): Promise<void> => {
  const key = `otp:${email}`;
  await redisClient.setex(key, OTP_EXPIRY, otp);
};

// Retrieve and verify OTP
export const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
  const key = `otp:${email}`;
  const storedOTP = await redisClient.get(key);
  
  if (!storedOTP) {
    return false; // OTP expired or doesn't exist
  }
  
  return storedOTP === otp;
};

// Delete OTP after verification
export const deleteOTP = async (email: string): Promise<void> => {
  const key = `otp:${email}`;
  await redisClient.del(key);
};

// Check if OTP exists
export const otpExists = async (email: string): Promise<boolean> => {
  const key = `otp:${email}`;
  const otp = await redisClient.get(key);
  return !!otp;
};

// Mark OTP as verified (used for flows like forgot-password)
export const markOTPVerified = async (email: string): Promise<void> => {
  const key = `otp_verified:${email}`;
  await redisClient.setex(key, OTP_EXPIRY, 'true');
};

// Check if OTP was verified recently
export const isOTPVerified = async (email: string): Promise<boolean> => {
  const key = `otp_verified:${email}`;
  const value = await redisClient.get(key);
  return value === 'true';
};

// Clear OTP verified marker
export const clearOTPVerified = async (email: string): Promise<void> => {
  const key = `otp_verified:${email}`;
  await redisClient.del(key);
};
