
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

// API Health Check
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

// --- User Management API Endpoints ---

// Get all users
app.get('/api/users', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a single user by ID
app.get('/api/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a user's role, status, or rating
app.put('/api/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role, status, rating } = req.body;

    // Basic validation
    if (!role && !status && rating === undefined) {
        return res.status(400).json({ error: 'At least one field (role, status, rating) must be provided for update.' });
    }

    try {
        const currentUserResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (currentUserResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentUser = currentUserResult.rows[0];
        const updatedUser = {
            role: role || currentUser.role,
            status: status || currentUser.status,
            rating: rating !== undefined ? rating : currentUser.rating,
        };

        const result = await pool.query(
            'UPDATE users SET role = $1, status = $2, rating = $3 WHERE id = $4 RETURNING *',
            [updatedUser.role, updatedUser.status, updatedUser.rating, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a user
app.delete('/api/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const deleteResult = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully', user: deleteResult.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- Knowledge Base API Endpoints ---

// Get all knowledge base entries
app.get('/api/knowledge-base', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM knowledge_base_entries ORDER BY last_updated DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new knowledge base entry
app.post('/api/knowledge-base', async (req: Request, res: Response) => {
    const { name, category, tags, description, price } = req.body;
    if (!name || !category || !description) {
        return res.status(400).json({ error: 'Name, category, and description are required fields.' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO knowledge_base_entries (name, category, tags, description, price, last_updated) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
            [name, category, tags, description, price]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a knowledge base entry
app.put('/api/knowledge-base/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, category, tags, description, price } = req.body;
     if (!name || !category || !description) {
        return res.status(400).json({ error: 'Name, category, and description are required fields.' });
    }
    try {
        const result = await pool.query(
            'UPDATE knowledge_base_entries SET name = $1, category = $2, tags = $3, description = $4, price = $5, last_updated = NOW() WHERE id = $6 RETURNING *',
            [name, category, tags, description, price, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Knowledge base entry not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a knowledge base entry
app.delete('/api/knowledge-base/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const deleteResult = await pool.query('DELETE FROM knowledge_base_entries WHERE id = $1 RETURNING *', [id]);
        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ error: 'Knowledge base entry not found' });
        }
        res.status(200).json({ message: 'Entry deleted successfully', entry: deleteResult.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
