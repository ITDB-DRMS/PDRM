import express from 'express';
import { 
    createSector,
    getSectors,
    getSectorById,
    getSectorsByOrg,
    updateSector,
    deleteSector
} from '../controllers/sectorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.post('/', protect, checkPermission('sector', 'create'), createSector);
router.get('/', protect, checkPermission('sector', 'view'), getSectors);
router.get('/:id', protect, checkPermission('sector', 'view'), getSectorById);
router.get('/organization/:orgId', protect, checkPermission('sector', 'view'), getSectorsByOrg);
router.put('/:id', protect, checkPermission('sector', 'update'), updateSector);
router.delete('/:id', protect, checkPermission('sector', 'delete'), deleteSector);

export default router;
