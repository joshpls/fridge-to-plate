import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max upload limit
});


export const handleUpload = (req: Request, res: Response, next: NextFunction) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Catch the specific file size limit error
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Image size exceeds the 10MB limit. Please choose a smaller file.' 
                });
            }
            // Catch any other multer errors (e.g., unexpected field)
            return res.status(400).json({ 
                status: 'error', 
                message: err.message 
            });
        } else if (err) {
            // Catch any non-multer errors
            return res.status(500).json({ 
                status: 'error', 
                message: 'An unknown error occurred during upload.' 
            });
        }
        
        // If no errors, proceed to your actual uploadImage controller
        next();
    });
};