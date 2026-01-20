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
import { applyScopeFilter, canAccessUser } from '../middleware/dataScope.js';
import { checkHierarchyLevel } from '../middleware/hierarchyAuth.js';

// User routes
const router = express.Router();

router.post('/',
    protect,
    checkHierarchyLevel('branch_admin'),
    upload.single('profileImage'),
    createUser
);

router.get('/',
    protect,
    applyScopeFilter,
    getUsers
);

router.get('/:id',
    protect,
    canAccessUser,
    getUserById
);

router.put('/:id',
    protect,
    canAccessUser,
    upload.single('profileImage'),
    updateUser
);

router.delete('/:id',
    protect,
    checkHierarchyLevel('branch_admin'),
    canAccessUser,
    deleteUser
);

export default router;