import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { Request } from "express";
import prisma from "./db.config";
import { env } from "../utils/env.utils";
import * as authService from "../services/auth.service";
import { AppError, BadRequestError } from "../types/error.types";

interface State {
  schoolId: string;
  deviceId?: string;
}

export const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env("GOOGLE_CLIENT_ID"),
        clientSecret: env("GOOGLE_CLIENT_SECRET"),
        callbackURL: env("GOOGLE_CALLBACK_URL"),
        passReqToCallback: true,
      },
      async (
        req: Request,
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done
      ) => {
        try {
          const stateJSON = Buffer.from(
            req.query.state as string,
            "base64"
          ).toString("ascii");
          const state: State = JSON.parse(stateJSON);

          if (!state.schoolId) {
            return done(
              new BadRequestError("School ID is missing from state."),
              false
            );
          }
          if (!state.deviceId) {
            return done(
              new BadRequestError("Device ID is missing from state."),
              false
            );
          }

          const school = await prisma.school.findUnique({
            where: { id: state.schoolId },
          });
          if (!school) {
            return done(
              new BadRequestError("Invalid school specified."),
              false
            );
          }

          if (!profile.emails || profile.emails.length === 0) {
            return done(
              new BadRequestError("No email found in Google profile."),
              false
            );
          }

          const googleProfile = {
            id: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0].value,
          };

          // 將 deviceId 傳遞下去
          const user = await authService.findOrCreateUserByGoogle(
            googleProfile,
            school
          );

          // 將 deviceId 附加到 user 物件上，方便 controller 使用
          if (state.deviceId) {
            (user as any).deviceId = state.deviceId;
          }

          return done(null, user);
        } catch (error) {
          console.error(`An error [${(error as any).message}] occured.`);
          if (error instanceof AppError) {
            return done(null, false, {
              message: error.message,
              code: error.code,
            });
          }
          return done(null, false, { message: (error as Error).message });
        }
      }
    )
  );
};
