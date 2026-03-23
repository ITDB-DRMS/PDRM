import express from 'express';
import {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
    getDepartmentsByOrg,
    getDepartmentsBySector
} from '../controllers/departmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, checkPermission('department', 'create'), createDepartment)
    .get(protect, checkPermission('department', 'view'), getDepartments);

router.route('/:id')
    .get(protect, checkPermission('department', 'view'), getDepartmentById)
    .put(protect, checkPermission('department', 'update'), updateDepartment)
    .delete(protect, checkPermission('department', 'delete'), deleteDepartment);

// Get departments of an organization
router.get('/organization/:orgId', protect, checkPermission('department', 'view'), getDepartmentsByOrg);

// Get departments of a sector

export default router;
