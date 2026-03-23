import express from 'express';
import { getPortalContent, upsertPortalContent } from '../controllers/portalContentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: portal reads content to render the landing page.
router.get('/', getPortalContent);

// Admin: manage portal website content.
import { checkPermission } from '../middleware/permissionMiddleware.js';
router.put('/', protect, checkPermission('portalcontent', 'update'), upsertPortalContent);

export default router;

