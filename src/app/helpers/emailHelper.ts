import nodemailer from 'nodemailer';
import { envVars } from '../config/env';

// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASS,
  },
});

// Function to send OTP email
export const sendOTPEmail = async (email: string, otp: string, fullName: string): Promise<void> => {
  const mailOptions = {
    from: envVars.EMAIL_FROM || envVars.SMTP_USER,
    to: email,
    subject: 'Your PilatesGo Email Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center;">Welcome to PilatesGo!</h2>
          <p style="color: #666; font-size: 16px;">Hello ${fullName},</p>
          <p style="color: #666; font-size: 16px;">Thank you for signing up. Your email verification code is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h1 style="color: #007bff; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">© 2026 PilatesGo. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

export const sendForgotPasswordOTPEmail = async (email: string, otp: string, fullName: string): Promise<void> => {
  const displayName = fullName?.trim() ? fullName : 'there';

  const mailOptions = {
    from: envVars.EMAIL_FROM || envVars.SMTP_USER,
    to: email,
    subject: 'PilatesGo Password Reset Code',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center;">Reset your PilatesGo password</h2>
          <p style="color: #666; font-size: 16px;">Hello ${displayName},</p>
          <p style="color: #666; font-size: 16px;">We received a request to reset your password. Your verification code is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h1 style="color: #007bff; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">© 2026 PilatesGo. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Forgot-password OTP email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending forgot-password OTP email:', error);
    throw new Error('Failed to send forgot-password OTP email');
  }
};
