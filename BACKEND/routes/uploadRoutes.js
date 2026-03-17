import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

const uploadDir = path.join(process.cwd(), 'uploads', 'portal');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const incidentDir = path.join(process.cwd(), 'uploads', 'incidents');
if (!fs.existsSync(incidentDir)) {
  fs.mkdirSync(incidentDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `portal-${unique}${ext}`);
  },
});

const upload = multer({ storage });

const incidentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, incidentDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.dat';
    cb(null, `incident-${unique}${ext}`);
  },
});

const incidentUpload = multer({ storage: incidentStorage });

router.post('/portal-image', protect, admin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({ url: `${baseUrl}/uploads/portal/${req.file.filename}` });
});

router.post('/incident-media', incidentUpload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({ url: `${baseUrl}/uploads/incidents/${req.file.filename}` });
});

export default router;
