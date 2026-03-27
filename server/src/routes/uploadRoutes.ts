// server/src/routes/uploadRoutes.ts
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';

const router = express.Router();

// This keeps the raw 10MB file in RAM instead of writing it to the SD card first
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max upload limit
});

// Ensure the uploads directory exists
const uploadDir = path.join(process.cwd(), 'public/uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'No file uploaded' });
        }

        // Generate a random filename with a .webp extension
        const randomName = crypto.randomBytes(16).toString('hex');
        const filename = `${randomName}.webp`;
        const outputPath = path.join(uploadDir, filename);

        // 2. Compress and resize using Sharp
        await sharp(req.file.buffer)
            .resize({ 
                width: 1200, 
                height: 1200, 
                fit: 'inside',
                withoutEnlargement: true 
            })
            .webp({ quality: 80 })
            .toFile(outputPath);

        const fileUrl = `/uploads/${filename}`; 
        return res.status(200).json({ status: 'success', imageUrl: fileUrl });

    } catch (error) {
        console.error('Image processing error:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to process image' });
    }
});

router.delete('/', async (req, res) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl || !imageUrl.startsWith('/uploads/')) {
            return res.status(400).json({ status: 'error', message: 'Invalid image URL' });
        }

        // Extract just the filename to prevent directory traversal attacks
        const filename = path.basename(imageUrl);
        const filePath = path.join(uploadDir, filename);

        await fs.unlink(filePath);
        return res.status(200).json({ status: 'success', message: 'File deleted' });
    } catch (error: any) {
        // If the file is already gone (ENOENT), treat it as a success
        if (error.code === 'ENOENT') {
            return res.status(200).json({ status: 'success', message: 'File already deleted' });
        }
        console.error('File deletion error:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to delete image' });
    }
});

export default router;
