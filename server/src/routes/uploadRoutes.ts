// server/src/routes/uploadRoutes.ts
import express from 'express';
import { deleteImage, uploadImage } from '../controllers/uploadController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { handleUpload } from '../middleware/handleUpload.js';

const router = express.Router();

router.post('/', requireAuth, handleUpload, uploadImage);
router.delete('/', requireAuth, deleteImage);

export default router;
