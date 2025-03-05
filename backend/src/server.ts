// src/server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Test database connection
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      message: 'Server is running',
      database: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server is running but database connection failed',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('TigerCode API is running with TypeScript!');
});

const server = app.listen(PORT, async () => {
  try {
    const client = await pool.connect();
    console.log('Connected to database successfully');
    client.release();
    
    console.log(`Server is running on http://localhost:${PORT}`);
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    console.log('Server is running, but database connection failed');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    // Close database pool
    await pool.end();
    console.log('Database connections closed');
    process.exit(0);
  });
});

export default app;