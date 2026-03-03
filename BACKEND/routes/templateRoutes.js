import express from 'express';
import multer from 'multer';
import {
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    publishTemplate,
    createNewVersion,
    archiveTemplate
} from '../controllers/templateController.js';
import { importWordTemplate } from '../controllers/importController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getTemplates);
router.get('/:id', getTemplateById);
router.post('/', createTemplate);
router.post('/import-word', upload.single('file'), importWordTemplate);
router.put('/:id', updateTemplate);
router.post('/:id/publish', publishTemplate);
router.post('/:id/new-version', createNewVersion);
router.delete('/:id', archiveTemplate);

export default router;
