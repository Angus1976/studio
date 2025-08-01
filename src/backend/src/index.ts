import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/', (req: Request, res: Response) => {
  res.send('AI SmartMatch Backend is running!');
});

// Example API endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    res.json({ status: 'ok', dbTime: result.rows[0].now });
    client.release();
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: err });
  }
});


app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
