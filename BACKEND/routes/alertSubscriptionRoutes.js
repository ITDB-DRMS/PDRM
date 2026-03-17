import express from 'express';
import {
  upsertAlertSubscriptionPublic,
  listAlertSubscriptions,
  getAlertSubscriptionById,
  updateAlertSubscription,
} from '../controllers/alertSubscriptionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public wizard submit (also works when logged in)
router.post('/', upsertAlertSubscriptionPublic);

// Admin management
router.get('/', protect, admin, listAlertSubscriptions);
router.get('/:id', protect, admin, getAlertSubscriptionById);
router.put('/:id', protect, admin, updateAlertSubscription);

export default router;

