import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
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

// JWT verification middleware
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
