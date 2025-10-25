import express from 'express';
import { createFeedback, getAllFeedback, getFeedbackById, respondToFeedback } from '../controllers/feedbackController.js';

const router = express.Router();

router.post('/', express.json(), createFeedback);
router.get('/', getAllFeedback);
router.get('/:id', getFeedbackById);
// respond/update feedback - keep protected (requires token)
router.put('/:id/respond', express.json(), respondToFeedback);

export default router;
