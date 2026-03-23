import express from 'express';
import {
    submitResponse,
    getResponses,
    getResponseById,
    updateResponse,
    deleteResponse,
    exportToCSV
} from '../controllers/formResponseController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.post('/', protect, checkPermission('formresponse', 'create'), submitResponse);
router.get('/', protect, checkPermission('formresponse', 'view'), getResponses);
router.get('/export/:templateId', protect, checkPermission('formresponse', 'view'), exportToCSV);
router.get('/:id', protect, checkPermission('formresponse', 'view'), getResponseById);
router.put('/:id', protect, checkPermission('formresponse', 'update'), updateResponse);
router.delete('/:id', protect, checkPermission('formresponse', 'delete'), deleteResponse);

export default router;
