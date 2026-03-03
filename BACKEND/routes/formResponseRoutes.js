import express from 'express';
import {
    submitResponse,
    getResponses,
    getResponseById,
    updateResponse,
    exportToCSV
} from '../controllers/formResponseController.js';

const router = express.Router();

router.post('/', submitResponse);
router.get('/', getResponses);
router.get('/export/:templateId', exportToCSV);
router.get('/:id', getResponseById);
router.put('/:id', updateResponse);

export default router;
