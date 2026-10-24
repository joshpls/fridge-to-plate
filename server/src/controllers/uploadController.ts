import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import sharp from 'sharp';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const uploadBaseDir = path.join(process.cwd(), 'public/uploads');

export const uploadImage = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'No file uploaded' });
        }

        // Organize by Year/Month subdirectories
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        
        const subDir = path.join('recipes', year, month);
        const fullSubDir = path.join(uploadBaseDir, subDir);
        
        await fs.mkdir(fullSubDir, { recursive: true });

        // Generate a random filename with a .webp extension
        const randomName = crypto.randomBytes(16).toString('hex');
        const filename = `${randomName}.webp`;
        const outputPath = path.join(fullSubDir, filename);

        // Compress and resize using Sharp
        await sharp(req.file.buffer)
            .resize({ 
                width: 1200, 
                height: 1200, 
                fit: 'inside',
                withoutEnlargement: true 
            })
            .webp({ quality: 80 })
            .toFile(outputPath);

        const fileUrl = `/uploads/${subDir}/${filename}`.replace(/\\/g, '/'); 
        return res.status(200).json({ status: 'success', imageUrl: fileUrl });

    } catch (error) {
        console.error('Image processing error:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to process image' });
    }
};

export const deleteLocalFile = async (imageUrl?: string | null) => {
    if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
    try {
        const relativePath = imageUrl.replace(/^\/uploads\//, '');
        const filePath = path.join(uploadBaseDir, relativePath);
        await fs.unlink(filePath);
    } catch (err: any) {
        if (err.code !== 'ENOENT') console.error('Failed to delete recipe image:', err);
    }
};

export const deleteImage = async (req: AuthRequest, res: Response) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl || !imageUrl.startsWith('/uploads/')) {
            return res.status(400).json({ status: 'error', message: 'Invalid image URL' });
        }

        await deleteLocalFile(imageUrl);
        return res.status(200).json({ status: 'success', message: 'File deleted' });
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return res.status(200).json({ status: 'success', message: 'File already deleted' });
        }
        console.error('File deletion error:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to delete image' });
    }
};
