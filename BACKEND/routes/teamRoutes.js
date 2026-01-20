import express from 'express';
import * as teamController from '../controllers/teamController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkHierarchyLevel } from '../middleware/hierarchyAuth.js';
import { applyScopeFilter } from '../middleware/dataScope.js';

const router = express.Router();

// Create team (directorate and above)
router.post('/',
    protect,
    checkHierarchyLevel('directorate'),
    teamController.createTeam
);

// Get all teams (with scope filtering)
router.get('/',
    protect,
    applyScopeFilter,
    teamController.getTeams
);

// Get team by ID
router.get('/:teamId',
    protect,
    teamController.getTeamById
);

// Update team (directorate and above)
router.put('/:teamId',
    protect,
    checkHierarchyLevel('directorate'),
    teamController.updateTeam
);

// Delete team (directorate and above)
router.delete('/:teamId',
    protect,
    checkHierarchyLevel('directorate'),
    teamController.deleteTeam
);

// Assign team leader (directorate and above)
router.put('/:teamId/leader',
    protect,
    checkHierarchyLevel('directorate'),
    teamController.assignTeamLeader
);

// Add team member (team leader and above)
router.post('/:teamId/members',
    protect,
    checkHierarchyLevel('team_leader'),
    teamController.addTeamMember
);

// Remove team member (team leader and above)
router.delete('/:teamId/members/:userId',
    protect,
    checkHierarchyLevel('team_leader'),
    teamController.removeTeamMember
);

// Get teams by department
router.get('/department/:departmentId',
    protect,
    teamController.getTeamsByDepartment
);

// Get teams by organization
router.get('/organization/:organizationId',
    protect,
    teamController.getTeamsByOrganization
);

// Get team statistics
router.get('/:teamId/stats',
    protect,
    teamController.getTeamStats
);

export default router;
