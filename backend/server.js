import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import cors from "cors";
import session from "express-session";
import User from "./models/User.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'e8d006ca3409ca0bbed13c60ebafe611fe4fd2857eff7d32185bce79ece996038c39b5fa35818467df36054c382281312478a1325e13d49214fd7c3efd950601',
    resave: false,
    saveUninitialized: false,
  })
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ mail: profile.emails[0].value });
        if (!user) {
          user = new User({
            mail: profile.emails[0].value,
            name: profile.displayName,
            role: 'student', // default role
          });
          await user.save();
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

app.use(passport.initialize());
app.use(passport.session());

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("http://localhost:3000/dashboard"); // redirect to frontend dashboard
  }
);

app.get("/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("http://localhost:3000/");
  });
});

app.get("/auth/current_user", (req, res) => {
  res.send(req.user);
});

mongoose
  .connect(process.env.MONG_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("listening on port", process.env.PORT);
      console.log("Mongodb connection established");
    });
  })
  .catch((error) => {
    console.log(error);
  });
