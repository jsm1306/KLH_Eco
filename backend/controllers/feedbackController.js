import Feedback from '../models/Feedback.js';
import jwt from 'jsonwebtoken';

// Create feedback or grievance (public)
export const createFeedback = async (req, res) => {
  try {
    const { name, email, type, subject, message } = req.body;

    // try to attach user from Authorization header if present
    let userId = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        userId = decoded.userId;
      } catch (e) {
        // ignore invalid token
      }
    }

    const fb = new Feedback({ user: userId, name, email, type, subject, message });
    await fb.save();
    res.status(201).json(fb);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all feedbacks (for admin) or user's own feedback
export const getAllFeedback = async (req, res) => {
  try {
    let query = {};
    
    // Check if user is authenticated
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const userId = decoded.userId;
        
        // If user is not admin, only show their own feedback
        // Assuming the decoded token contains role information
        // You may need to fetch the user from DB to check role
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(userId);
        
        if (user && user.role !== 'admin') {
          // Regular user - only show their own feedback
          query = { user: userId };
        }
        // If admin, query remains empty (show all feedback)
      } catch (e) {
        // Invalid token - show no feedback
        return res.json([]);
      }
    } else {
      // No auth header - show no feedback
      return res.json([]);
    }
    
    const items = await Feedback.find(query).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single feedback
export const getFeedbackById = async (req, res) => {
  try {
    const fb = await Feedback.findById(req.params.id).populate('user', 'name mail');
    if (!fb) return res.status(404).json({ message: 'Not found' });
    res.json(fb);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Respond/update feedback (protected)
export const respondToFeedback = async (req, res) => {
  try {
    const { response, status } = req.body;
    const fb = await Feedback.findById(req.params.id);
    if (!fb) return res.status(404).json({ message: 'Not found' });
    if (response) fb.response = response;
    if (status) fb.status = status;
    await fb.save();
    res.json(fb);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
