import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import sharp from 'sharp';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import type { AuthRequest } from '../middleware/authMiddleware.js';

// Ensure the uploads directory exists
const uploadDir = path.join(process.cwd(), 'public/uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

export const uploadImage = async (req: AuthRequest, res: Response) => {
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
};

export const deleteImage = async (req: AuthRequest, res: Response) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl || !imageUrl.startsWith('/uploads/')) {
            return res.status(400).json({ status: 'error', message: 'Invalid image URL' });
        }

        const filename = path.basename(imageUrl);
        const filePath = path.join(uploadDir, filename);

        await fs.unlink(filePath);
        return res.status(200).json({ status: 'success', message: 'File deleted' });
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return res.status(200).json({ status: 'success', message: 'File already deleted' });
        }
        console.error('File deletion error:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to delete image' });
    }
};
