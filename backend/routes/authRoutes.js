import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import "../utils/passportConfig.js"; // import the strategy setup
import User from "../models/User.js";

const router = express.Router();

// Step 1: Redirect to Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "mail"] }));

// Step 2: Google callback
router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "https://klh-eco-frontend.onrender.com" }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.redirect(`https://klh-eco-frontend.onrender.com/dashboard?token=${token}`);
  }
);

// Step 3: Get current user info
router.get("/current_user", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Error in current_user:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

export default router;
