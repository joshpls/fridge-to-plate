// src/index.ts
import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { pool } from './config/db.js';
import pantryRoutes from './routes/pantryRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import recipeRoutes from './routes/recipeRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import path from 'path';

const app = express();
const PORT = 5000;

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Only 5 login/register attempts per 15 minutes
    message: { status: 'error', message: 'Too many attempts, please try again in 15 minutes.' }
});

app.use(cors());
app.use(express.json());

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/comments', commentRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

// Startup Verification
(async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log("✅ Database and Server are ready!");
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err);
  }
})();
