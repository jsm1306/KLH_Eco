import express from 'express';
import { getNotifications, markRead, markAllRead } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', getNotifications);
router.put('/:id/read', markRead);
router.put('/read-all', markAllRead);

export default router;
