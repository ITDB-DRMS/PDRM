import express from 'express';
import multer from 'multer';
import {
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    publishTemplate,
    revertToDraft,
    createNewVersion,
    archiveTemplate,
    restoreTemplate,
    deleteTemplatePermanent
} from '../controllers/templateController.js';
import { importWordTemplate } from '../controllers/importController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getTemplates);
router.post('/', createTemplate);
router.post('/import-word', upload.single('file'), importWordTemplate); // ⚠ Must be before /:id
router.get('/:id', getTemplateById);
router.put('/:id', updateTemplate);
router.post('/:id/publish', publishTemplate);
router.post('/:id/revert-to-draft', revertToDraft);
router.post('/:id/new-version', createNewVersion);
router.post('/:id/restore', restoreTemplate);
router.delete('/:id', archiveTemplate);
router.delete('/:id/permanent', deleteTemplatePermanent);

export default router;
