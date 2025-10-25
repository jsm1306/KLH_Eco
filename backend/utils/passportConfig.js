import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://klh-eco-backend.onrender.com/auth/google/callback",
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
