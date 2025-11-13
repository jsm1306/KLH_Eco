import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

// Allow configuring the backend/callback URL via env. Falls back to localhost for dev.
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${BACKEND_URL}/auth/google/callback`;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const mail = profile.mails[0].value.toLowerCase();

        // Allow only KLH emails
        if (!mail.endsWith("@klh.edu.in")) {
          return done(null, false, { message: "Only @klh.edu.in emails are allowed" });
        }

        let user = await User.findOne({ mail: mail });
        if (!user) {
          user = await User.create({
            mail: mail,
            name: profile.displayName,
            role: "student",
          });
        }

        return done(null, user);
      } catch (err) {
        console.error("Passport Error:", err);
        done(err, false);
      }
    }
  )
);
