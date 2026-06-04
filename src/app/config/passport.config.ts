/* eslint-disable @typescript-eslint/no-explicit-any */
import passport, { Profile } from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import {
  Strategy as GoogleStrategy,
  VerifyCallback,
} from "passport-google-oauth20";
import { Strategy as AppleStrategy } from "passport-apple";
import bcrypt from "bcryptjs";

import { envVars } from "./env";
import prisma from "../shared/prisma";
import { UserRole } from "../../../prisma/generated/prisma/enums";

const AuthProviderType = {
  GOOGLE: "GOOGLE",
  APPLE: "APPLE",
} as const;

type AuthProviderType = (typeof AuthProviderType)[keyof typeof AuthProviderType];

type DoneCallback = (err: any, user?: any, info?: any) => void;

const createOAuthPassword = async (seed: string) => {
  const rounds = parseInt(envVars.BCRYPT_SALT_ROUND || "10", 10);
  return bcrypt.hash(`oauth:${seed}:${Date.now()}`, rounds);
};

// ✅ Local strategy (BLOCK oauth accounts)
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email: string, password: string, done: DoneCallback) => {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return done(null, false, { message: "Invalid email or password" });

        if (user.isDeleted) return done(null, false, { message: "User deleted" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return done(null, false, { message: "Invalid email or password" });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ✅ Google strategy
if (envVars.GOOGLE_AUTH) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: envVars.GOOGLE_AUTH.GOOGLE_CLIENT_ID,
        clientSecret: envVars.GOOGLE_AUTH.GOOGLE_CLIENT_SECRET,
        callbackURL: envVars.GOOGLE_AUTH.GOOGLE_CALLBACK_URL,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(null, false, { message: "No email found from Google" });

          let user = await prisma.user.findUnique({
            where: { email },
            include: { authProviders: true },
          });

          if (user && user.isDeleted) return done(null, false, { message: "User is deleted" });

          if (!user) {
            const password = await createOAuthPassword(`google:${profile.id}`);
            user = await prisma.user.create({
              data: {
                email,
                password,
                fullName: profile.displayName,
                role: UserRole.USER,
                isVerified: true,
                authProviders: {
                  create: {
                    provider: AuthProviderType.GOOGLE,
                    providerId: profile.id,
                  },
                },
              },
              include: { authProviders: true },
            });
          } else {
            const hasGoogle = user.authProviders?.some(
              (p) => p.provider === AuthProviderType.GOOGLE
            );
            if (!hasGoogle) {
              await prisma.authProvider.create({
                data: {
                  provider: AuthProviderType.GOOGLE,
                  providerId: profile.id,
                  userId: user.id,
                },
              });
            }
          }

          if (!user) return done(null, false, { message: "User not found" });
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

if (envVars.APPLE_AUTH) {
  passport.use(
    new AppleStrategy(
      {
        clientID: envVars.APPLE_AUTH.APPLE_CLIENT_ID,
        teamID: envVars.APPLE_AUTH.APPLE_TEAM_ID,
        keyID: envVars.APPLE_AUTH.APPLE_KEY_ID,
        privateKeyString: envVars.APPLE_AUTH.APPLE_PRIVATE_KEY_PATH,
        callbackURL: envVars.APPLE_AUTH.APPLE_CALLBACK_URL,
        scope: ["name", "email"],
        passReqToCallback: false,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        idToken: any,
        profile: any,
        done: DoneCallback,
      ) => {
        try {
          const appleId = idToken?.sub || profile?.id;
          const email = profile?.email;
          const fullName = profile?.name
            ? `${profile.name.firstName ?? ""} ${profile.name.lastName ?? ""}`.trim()
            : undefined;

          if (!appleId)
            return done(null, false, { message: "No Apple user id found" });

          let user = await prisma.user.findFirst({
            where: {
              authProviders: {
                some: {
                  provider: AuthProviderType.APPLE,
                  providerId: appleId,
                },
              },
            },
            include: { authProviders: true },
          });

          if (!user && email) {
            user = await prisma.user.findUnique({
              where: { email },
              include: { authProviders: true },
            });
          }

          if (user && user.isDeleted)
            return done(null, false, { message: "User is deleted" });

          if (!user) {
            const password = await createOAuthPassword(`apple:${appleId}`);
            user = await prisma.user.create({
              data: {
                email: email ?? "",
                password,
                fullName: fullName ?? "Apple User",
                role: UserRole.USER,
                isVerified: true,
                authProviders: {
                  create: {
                    provider: AuthProviderType.APPLE,
                    providerId: appleId,
                  },
                },
              },
              include: { authProviders: true },
            });
          } else {
            const hasApple = user.authProviders?.some(
              (p) => p.provider === AuthProviderType.APPLE,
            );

            if (!hasApple) {
              await prisma.authProvider.create({
                data: {
                  provider: AuthProviderType.APPLE,
                  providerId: appleId,
                  userId: user.id,
                },
              });
            }

            const update: { email?: string; fullName?: string } = {};
            if (!user.email && email) update.email = email;
            if ((!user.fullName || user.fullName === "Apple User") && fullName) {
              update.fullName = fullName;
            }

            if (Object.keys(update).length) {
              await prisma.user.update({
                where: { id: user.id },
                data: update,
              });
            }
          }

          if (!user) return done(null, false, { message: "User not found" });
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    )
  );
}

export default passport;
