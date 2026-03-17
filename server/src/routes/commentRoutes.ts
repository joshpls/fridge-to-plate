// server/src/routes/commentRoutes.ts
import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { prisma } from '../config/db.js';

const router = express.Router();

// DELETE /api/comments/:id
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const id = req.params.id as string;
        await prisma.comment.delete({ where: { id } });
        res.status(200).json({ status: 'success', message: "Comment deleted" });
    } catch (error) {
        res.status(500).json({ status: 'error', message: "Failed to delete comment" });
    }
});

export default router;