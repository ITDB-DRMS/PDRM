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
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, admin, createDepartment)
    .get(protect, admin, getDepartments);

router.route('/:id')
    .get(protect, admin, getDepartmentById)
    .put(protect, admin, updateDepartment)
    .delete(protect, admin, deleteDepartment);

// Get departments of an organization
router.get('/organization/:orgId', protect, admin, getDepartmentsByOrg);

// Get departments of a sector
router.get('/sector/:sectorId', protect, admin, getDepartmentsBySector);

export default router;
