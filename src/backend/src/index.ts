
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


// --- Supplier API Endpoints ---

// Get all suppliers
app.get('/api/suppliers', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT id, full_name, short_name, logo_url, region, address FROM suppliers');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a single supplier with their products
app.get('/api/suppliers/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const supplierRes = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);
        if (supplierRes.rowCount === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        const productsRes = await pool.query('SELECT * FROM products WHERE supplier_id = $1', [id]);
        res.json({
            ...supplierRes.rows[0],
            products: productsRes.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a supplier's info (we will use PUT for simplicity to replace the whole record)
app.put('/api/suppliers/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        full_name, short_name, logo_url, introduction, region, address, establishment_date,
        registered_capital, credit_code, business_license_url, contact_person, contact_title,
        contact_mobile, contact_phone, contact_email, contact_wecom, custom_fields
    } = req.body;

    if (!full_name) {
        return res.status(400).json({ error: 'Supplier full name is required' });
    }
    
    try {
        const result = await pool.query(
            `UPDATE suppliers SET 
                full_name = $1, short_name = $2, logo_url = $3, introduction = $4, region = $5, address = $6, establishment_date = $7,
                registered_capital = $8, credit_code = $9, business_license_url = $10, contact_person = $11, contact_title = $12,
                contact_mobile = $13, contact_phone = $14, contact_email = $15, contact_wecom = $16, custom_fields = $17
            WHERE id = $18 RETURNING *`,
            [
                full_name, short_name, logo_url, introduction, region, address, establishment_date,
                registered_capital, credit_code, business_license_url, contact_person, contact_title,
                contact_mobile, contact_phone, contact_email, contact_wecom, custom_fields, id
            ]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- Product API Endpoints ---

// Create a product for a supplier
app.post('/api/suppliers/:supplierId/products', async (req: Request, res: Response) => {
    const { supplierId } = req.params;
    // Note: This is a simplified version. A real app would have more robust validation
    const { name, description, price, category, sku, purchase_url, custom_fields,
            media_panoramic, media_top, media_bottom, media_left, media_right, media_front, media_back 
    } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Product name is required' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO products (supplier_id, name, description, price, category, sku, purchase_url, custom_fields, media_panoramic, media_top, media_bottom, media_left, media_right, media_front, media_back) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
            [supplierId, name, description, price, category, sku, purchase_url, custom_fields, media_panoramic, media_top, media_bottom, media_left, media_right, media_front, media_back]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- Demand Pool API Endpoints ---

// Get all demands
app.get('/api/demands', async (req: Request, res: Response) => {
    try {
        // In a real app, you'd likely join with users table to get poster's name
        const result = await pool.query('SELECT d.*, u.name as posted_by FROM demands d JOIN users u ON d.user_id = u.id ORDER BY posted_date DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new demand
app.post('/api/demands', async (req: Request, res: Response) => {
    // In a real app, user_id would come from authenticated session
    const { user_id, title, description, budget, category, tags } = req.body;
    if (!user_id || !title || !description) {
        return res.status(400).json({ error: 'user_id, title, and description are required' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO demands (user_id, title, description, budget, category, tags, status) 
             VALUES ($1, $2, $3, $4, $5, $6, '开放中') RETURNING *`,
            [user_id, title, description, budget, category, tags]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});

    