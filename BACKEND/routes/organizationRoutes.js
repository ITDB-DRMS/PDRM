import express from 'express';
import {
    createOrganization,
    getOrganizations,
    getOrganizationById,
    updateOrganization,
    deleteOrganization
} from '../controllers/organizationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, admin, createOrganization)
    .get(protect, admin, getOrganizations);

router.route('/:id')
    .get(protect, admin, getOrganizationById)
    .put(protect, admin, updateOrganization)
    .delete(protect, admin, deleteOrganization);

export default router;
