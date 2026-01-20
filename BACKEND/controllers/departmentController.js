import * as departmentService from '../services/departmentService.js';
import * as auditService from '../services/auditService.js';
import { validateDepartment, transformDepartmentInput, formatDepartmentResponse } from '../dto/departmentDTO.js';

export const createDepartment = async (req, res) => {
    try {
        const transformedData = transformDepartmentInput(req.body);
        const validation = validateDepartment(transformedData);
        if (!validation.isValid) {
            return res.status(400).json({ message: 'Validation Error', errors: validation.errors });
        }

        const department = await departmentService.createDepartment(transformedData);

        await auditService.logAction({
            userId: req.user.id,
            action: 'DEPARTMENT_CREATE',
            resource: 'Department',
            after: department,
            ip: req.ip
        });

        res.status(201).json(formatDepartmentResponse(department));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getDepartments = async (req, res) => {
    try {
        const departments = await departmentService.getAllDepartments();
        res.json(departments.map(formatDepartmentResponse));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getDepartmentById = async (req, res) => {
    try {
        const department = await departmentService.getDepartmentById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.json(formatDepartmentResponse(department));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateDepartment = async (req, res) => {
    try {
        // Transform input for updates
        const transformedData = transformDepartmentInput(req.body);

        // Get before state for audit
        const beforeDepartment = await departmentService.getDepartmentById(req.params.id);
        if (!beforeDepartment) {
            return res.status(404).json({ message: 'Department not found' });
        }

        const department = await departmentService.updateDepartment(req.params.id, transformedData);

        await auditService.logAction({
            userId: req.user.id,
            action: 'DEPARTMENT_UPDATE',
            resource: 'Department',
            before: formatDepartmentResponse(beforeDepartment),
            after: formatDepartmentResponse(department),
            ip: req.ip
        });

        res.json(formatDepartmentResponse(department));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteDepartment = async (req, res) => {
    try {
        const department = await departmentService.deleteDepartment(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        await auditService.logAction({
            userId: req.user.id,
            action: 'DEPARTMENT_DELETE',
            resource: 'Department',
            before: department,
            ip: req.ip
        });

        res.json({ message: 'Department deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Optional: Get departments by organization
export const getDepartmentsByOrg = async (req, res) => {
    try {
        const departments = await departmentService.getDepartmentsByOrganization(req.params.orgId);
        res.json(departments.map(formatDepartmentResponse));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get departments by sector
export const getDepartmentsBySector = async (req, res) => {
    try {
        const departments = await departmentService.getDepartmentsBySector(req.params.sectorId);
        res.json(departments.map(formatDepartmentResponse));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
