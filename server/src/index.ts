import express from 'express';
import cors from 'cors';
import { pool } from './config/db.js';
import pantryRoutes from './routes/pantryRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import recipeRoutes from './routes/recipeRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import householdRoutes from './routes/householdRoutes.js';
import { tokenBucketLimiter } from './middleware/rateLimiter.js';
import cookieParser from 'cookie-parser';
import path from 'path';

const app = express();
app.set('trust proxy', 1);
const PORT = 5000;

app.use(cors({
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : [],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api', tokenBucketLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/household', householdRoutes)
app.use('/api/recipes', recipeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// This serves the CSS, JS, and images compiled by Vite
app.use(express.static(path.join(process.cwd(), 'public')));

app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
    }
    // Otherwise, serve the React app
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

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
