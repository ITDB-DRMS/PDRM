import express from 'express';
import {
  createIncidentReportPublic,
  listIncidentReports,
  getIncidentReportById,
  updateIncidentReport,
} from '../controllers/incidentReportController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public submit
router.post('/', createIncidentReportPublic);

// Admin management
router.get('/', protect, admin, listIncidentReports);
router.get('/:id', protect, admin, getIncidentReportById);
router.put('/:id', protect, admin, updateIncidentReport);

export default router;
