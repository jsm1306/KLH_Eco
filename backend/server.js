import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import cors from "cors";
import session from "express-session";
import multer from "multer";
import path from "path";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import User from "./models/User.js";
import LostFound from "./models/LostFound.js";
import Notification from './models/Notification.js';

import eventRoutes from "./routes/eventRoutes.js";
import { createEvent, updateEvent, subscribeEvent, unsubscribeEvent } from "./controllers/eventController.js";
import clubRoutes from "./routes/clubRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();
// Configurable frontend URL for redirects and CORS (set FRONTEND_URL in production)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use('/uploads', express.static('uploads'));

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
        console.log('Profile:', profile); // Debug log
        if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
          return done(new Error('No email provided by Google'), null);
        }
        const email = profile.emails[0].value;
        let user = await User.findOne({ mail: email });
        if (!user) {
          user = new User({
            mail: email,
            name: profile.displayName,
            role: 'student', // default role
          });
          await user.save();
        }
        return done(null, user);
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error, find existing user
          const email = profile.emails[0].value;
          const existingUser = await User.findOne({ mail: email });
          return done(null, existingUser);
        }
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

// Root route to redirect to frontend
app.get("/", (req, res) => {
  res.redirect(`${FRONTEND_URL}/`);
});

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
    // Set token in cookie
    res.cookie('token', token, { httpOnly: true });
    // Log token and redirect URL for debugging
    // Use URL hash to transmit token to frontend (not sent to server on subsequent requests)
  const redirectUrl = `${FRONTEND_URL}/dashboard?token=${token}`;
    console.log('OAuth callback: issuing token, token length:', token.length, 'redirecting to', redirectUrl);
    // Also include token in redirect URL query param so frontend can pick it up
    // NOTE: In production you should prefer httpOnly cookie + proper SameSite/Secure settings.
    res.redirect(redirectUrl); // redirect to frontend dashboard
  }
);

app.get("/auth/logout", (req, res) => {
  // Clear the JWT cookie and destroy the session if present.
  try {
    res.clearCookie('token');
    // Passport's req.logout may accept a callback in newer versions.
    if (typeof req.logout === 'function') {
      req.logout(function(err) {
        if (err) {
          console.error('Error during req.logout:', err);
        }
        // Destroy session store if present
          if (req.session) {
          req.session.destroy(() => {
            res.redirect(`${FRONTEND_URL}/`);
          });
        } else {
          res.redirect(`${FRONTEND_URL}/`);
        }
      });
    } else {
      if (req.session) {
        req.session.destroy(() => {
          res.redirect(`${FRONTEND_URL}/`);
        });
      } else {
        res.redirect(`${FRONTEND_URL}/`);
      }
    }
    } catch (err) {
    console.error('Logout error:', err);
    res.redirect(`${FRONTEND_URL}/`);
  }
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  // Support token from Authorization header (Bearer) or cookie
  let token = null;
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Debug logging to help trace why token might be missing in client requests
  console.log('verifyToken called - authHeader present:', !!authHeader, 'cookie present:', !!(req.cookies && req.cookies.token));
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get("/auth/current_user", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Debug endpoint: echo cookies and headers so frontend can inspect what is being sent by the browser
app.get('/auth/echo', (req, res) => {
  res.json({ cookies: req.cookies || {}, headers: { authorization: req.headers.authorization || null } });
});

// Lost and Found routes
app.post("/api/lostfound", verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { tag, location, description } = req.body;
    const image = req.file ? req.file.path : null;
    const item = new LostFound({
      user: req.userId,
      tag,
      location,
      image,
      description,
    });
    await item.save();
    res.status(201).send(item);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/api/lostfound", async (req, res) => {
  try {
    const items = await LostFound.find().populate('user', 'name mail');
    res.send(items);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Events: allow multipart/form-data uploads for event posters
// This route handles creating events with an optional uploaded image file.
app.post('/api/events', verifyToken, upload.single('image'), createEvent);
// Support updating event with optional image upload
app.put('/api/events/:id', verifyToken, upload.single('image'), updateEvent);
// Subscribe / unsubscribe (protected)
app.post('/api/events/:id/subscribe', verifyToken, subscribeEvent);
app.post('/api/events/:id/unsubscribe', verifyToken, unsubscribeEvent);

// Submit a claim for a lost item
app.post("/api/lostfound/:id/claim", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const item = await LostFound.findById(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.user.toString() === req.userId) return res.status(400).json({ error: 'Cannot claim your own item' });

    // Check if user already claimed
    const existingClaim = item.claims.find(c => c.claimant.toString() === req.userId);
    if (existingClaim) return res.status(400).json({ error: 'You have already claimed this item' });

    item.claims.push({
      claimant: req.userId,
      message,
      status: 'pending',
    });
    await item.save();
    // create an in-app notification for the poster of the item
    try {
      const claimant = await User.findById(req.userId);
      const posterId = item.user;
      const title = 'New claim on your item';
      const msg = `${claimant.name || 'Someone'} has claimed your item "${item.tag || 'item'}". Click to view claims.`;
      await Notification.create({ user: posterId, title, message: msg, link: `/lostfound/${item._id}/claims` });
    } catch (notifErr) {
      console.error('Failed to create notification for claim:', notifErr);
    }
    res.status(201).json({ message: 'Claim submitted successfully' });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Get claims for a lost item (only for the poster)
app.get("/api/lostfound/:id/claims", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostFound.findById(id).populate('claims.claimant', 'name mail');
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.user.toString() !== req.userId) return res.status(403).json({ error: 'Not authorized' });

    res.json(item.claims);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Verify (approve/reject) a claim
app.put("/api/lostfound/:id/claim/:claimId/verify", verifyToken, async (req, res) => {
  try {
    const { id, claimId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const item = await LostFound.findById(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.user.toString() !== req.userId) return res.status(403).json({ error: 'Not authorized' });

    const claim = item.claims.id(claimId);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    claim.status = status;
    await item.save();

    // notify claimant about the result
    try {
      const claimantUser = await User.findById(claim.claimant);
      const poster = await User.findById(req.userId);
      if (claimantUser) {
        const title = status === 'approved' ? 'Your claim was approved' : 'Your claim was rejected';
        const msg = status === 'approved'
          ? `${poster.name || 'An owner'} approved your claim for "${item.tag || 'item'}".`
          : `${poster.name || 'An owner'} rejected your claim for "${item.tag || 'item'}".`;
        await Notification.create({ user: claimantUser._id, title, message: msg, link: status === 'approved' ? `/lostfound` : `/lostfound/${item._id}/claims` });
      }
    } catch (notifErr) {
      console.error('Failed to notify claimant:', notifErr);
    }

    if (status === 'approved') {
      // Delete the item from database
      await LostFound.findByIdAndDelete(id);
      res.json({ message: 'Claim approved and item removed' });
    } else {
      res.json({ message: 'Claim rejected' });
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
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


// Default route (for sanity check)
app.get("/", (req, res) => {
  res.send("KLH Smart Campus API is running...");
});

// Use routes
app.use("/api/events", eventRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use('/api/notifications', verifyToken, notificationRoutes);