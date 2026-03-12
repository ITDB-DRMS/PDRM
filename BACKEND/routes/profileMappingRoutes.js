import express from 'express';
import { 
    getProfileMappings, 
    getMappingBySource, 
    createProfileMapping, 
    updateProfileMapping, 
    deleteProfileMapping 
} from '../controllers/profileMappingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getProfileMappings)
    .post(protect, createProfileMapping);

router.route('/source/:sourceId')
    .get(protect, getMappingBySource);

router.route('/:id')
    .put(protect, updateProfileMapping)
    .delete(protect, deleteProfileMapping);

export default router;
