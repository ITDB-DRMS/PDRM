import express from 'express';
import {
    createOrganization,
    getOrganizations,
    getOrganizationById,
    updateOrganization,
    deleteOrganization
} from '../controllers/organizationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, checkPermission('organization', 'create'), createOrganization)
    .get(protect, checkPermission('organization', 'view'), getOrganizations);

router.route('/:id')
    .get(protect, checkPermission('organization', 'view'), getOrganizationById)
    .put(protect, checkPermission('organization', 'update'), updateOrganization)
    .delete(protect, checkPermission('organization', 'delete'), deleteOrganization);

export default router;
