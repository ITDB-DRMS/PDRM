import express from 'express';
import {
    createPermission,
    getPermissions,
    getPermissionById,
    updatePermission,
    deletePermission
} from '../controllers/permissionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, admin, createPermission)
    .get(protect, admin, getPermissions);

router.route('/:id')
    .get(protect, admin, getPermissionById)
    .put(protect, admin, updatePermission)
    .delete(protect, admin, deletePermission);

export default router;
