import express from 'express';
import multer from 'multer';
import {
    getWoredaProfiles,
    getWoredaProfileById,
    createWoredaProfile,
    updateWoredaProfile,
    deleteWoredaProfile,
    getWoredaProfileStats,
    importWoredaProfile,
    syncFromInterview
} from '../controllers/woredaProfileController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/stats', protect, checkPermission('woredaprofile', 'view'), getWoredaProfileStats);
router.get('/', protect, checkPermission('woredaprofile', 'view'), getWoredaProfiles);
router.post('/', protect, checkPermission('woredaprofile', 'create'), createWoredaProfile);
router.post('/import', protect, checkPermission('woredaprofile', 'import'), upload.single('file'), importWoredaProfile);
router.post('/sync-interview', protect, checkPermission('woredaprofile', 'sync'), syncFromInterview);
router.get('/:id', protect, checkPermission('woredaprofile', 'view'), getWoredaProfileById);
router.put('/:id', protect, checkPermission('woredaprofile', 'update'), updateWoredaProfile);
router.delete('/:id', protect, checkPermission('woredaprofile', 'delete'), deleteWoredaProfile);

export default router;
