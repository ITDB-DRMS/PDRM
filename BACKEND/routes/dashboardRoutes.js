import express from 'express';
import { getStats } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js'; // Assuming auth is needed

const router = express.Router();

router.get('/stats', protect, getStats); // Protect the route if necessary, assume yes given the context

export default router;
