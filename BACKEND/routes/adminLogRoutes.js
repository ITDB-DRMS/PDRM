import express from 'express';
import { getAdminLogs, clearOldAdminLogs } from '../controllers/adminLogController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, admin); // All admin log routes require admin status

router.get('/', getAdminLogs);
router.delete('/purge', clearOldAdminLogs);

export default router;
