import type { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Global Error:", err.message);

  // Prisma unique constraint error
  if (err.code === 'P2002') {
    return res.status(400).json({ error: "A record with this value already exists." });
  }

  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' ? "Internal Server Error" : err.message 
  });
};
