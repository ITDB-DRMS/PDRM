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
import { checkPermission } from '../middleware/permissionMiddleware.js';
router.get('/', protect, checkPermission('alertsubscription', 'view'), listAlertSubscriptions);
router.get('/:id', protect, checkPermission('alertsubscription', 'view'), getAlertSubscriptionById);
router.put('/:id', protect, checkPermission('alertsubscription', 'update'), updateAlertSubscription);

export default router;

