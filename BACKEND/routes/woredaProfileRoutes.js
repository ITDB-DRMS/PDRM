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

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect); // All routes require authentication

router.get('/stats', getWoredaProfileStats);
router.get('/', getWoredaProfiles);
router.post('/', createWoredaProfile);
router.post('/import', upload.single('file'), importWoredaProfile);
router.post('/sync-interview', syncFromInterview);
router.get('/:id', getWoredaProfileById);
router.put('/:id', updateWoredaProfile);
router.delete('/:id', deleteWoredaProfile);

export default router;
