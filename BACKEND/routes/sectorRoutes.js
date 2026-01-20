import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    createSector,
    getSectors,
    getSectorById,
    getSectorsByOrg,
    updateSector,
    deleteSector
} from '../controllers/sectorController.js';

const router = express.Router();

router.post('/', protect, admin, createSector);
router.get('/', protect, getSectors);
router.get('/:id', protect, getSectorById);
router.get('/organization/:orgId', protect, getSectorsByOrg);
router.put('/:id', protect, admin, updateSector);
router.delete('/:id', protect, admin, deleteSector);

export default router;
