import express from 'express';
import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
} from '../controllers/userController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { applyScopeFilter, canAccessUser } from '../middleware/dataScope.js';
import { checkHierarchyLevel } from '../middleware/hierarchyAuth.js';

// User routes
const router = express.Router();

router.post('/',
    protect,
    checkPermission('user', 'create'),
    upload.single('profileImage'),
    createUser
);

router.get('/',
    protect,
    checkPermission('user', 'view'),
    applyScopeFilter,
    getUsers
);

router.get('/:id',
    protect,
    checkPermission('user', 'view'),
    canAccessUser,
    getUserById
);

router.put('/:id',
    protect,
    checkPermission('user', 'update'),
    canAccessUser,
    upload.single('profileImage'),
    updateUser
);

router.delete('/:id',
    protect,
    checkPermission('user', 'delete'),
    canAccessUser,
    deleteUser
);

export default router;