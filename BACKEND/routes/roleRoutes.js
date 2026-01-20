import express from 'express';
import {
    createRole,
    getRoles,
    getRoleById,
    updateRole,
    deleteRole
} from '../controllers/roleController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, admin, createRole)
    .get(protect, admin, getRoles);

router.route('/:id')
    .get(protect, admin, getRoleById)
    .put(protect, admin, updateRole)
    .delete(protect, admin, deleteRole);

export default router;
