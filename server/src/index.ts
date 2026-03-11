// src/index.ts
import express from 'express';
import cors from 'cors';
import { pool } from './config/db.js';
import pantryRoutes from './routes/pantryRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import recipeRoutes from './routes/recipeRoutes.js';
import shoppingRoutes from './routes/shoppingRoutes.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', pantryRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/shopping-list', shoppingRoutes);
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
