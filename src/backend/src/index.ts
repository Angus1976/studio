
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


// --- Designers API ---

// Get all users with the 'creator' role
app.get('/api/designers', async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT id, name, avatar, description, status, rating, '[]'::text[] as specialties FROM users WHERE role = 'creator'");
        res.json(result.rows);
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

// Get a single knowledge base entry
app.get('/api/knowledge-base/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM knowledge_base_entries WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        res.json(result.rows[0]);
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
            [name, category, tags || [], description, price]
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
            [name, category, tags || [], description, price, id]
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
        const productsRes = await pool.query('SELECT * FROM products WHERE supplier_id = $1 ORDER BY id', [id]);
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
    
    // In a real app, you'd check if a supplier with this ID exists before inserting.
    // Here we use ON CONFLICT to handle both creation (if not exists) and update.
    try {
        const result = await pool.query(
            `INSERT INTO suppliers (id, full_name, short_name, logo_url, introduction, region, address, establishment_date, registered_capital, credit_code, business_license_url, contact_person, contact_title, contact_mobile, contact_phone, contact_email, contact_wecom, custom_fields)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
             ON CONFLICT (id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                short_name = EXCLUDED.short_name,
                logo_url = EXCLUDED.logo_url,
                introduction = EXCLUDED.introduction,
                region = EXCLUDED.region,
                address = EXCLUDED.address,
                establishment_date = EXCLUDED.establishment_date,
                registered_capital = EXCLUDED.registered_capital,
                credit_code = EXCLUDED.credit_code,
                business_license_url = EXCLUDED.business_license_url,
                contact_person = EXCLUDED.contact_person,
                contact_title = EXCLUDED.contact_title,
                contact_mobile = EXCLUDED.contact_mobile,
                contact_phone = EXCLUDED.contact_phone,
                contact_email = EXCLUDED.contact_email,
                contact_wecom = EXCLUDED.contact_wecom,
                custom_fields = EXCLUDED.custom_fields,
                last_updated = NOW()
             RETURNING *`,
            [
                id, full_name, short_name, logo_url, introduction, region, address, establishment_date,
                registered_capital, credit_code, business_license_url, contact_person, contact_title,
                contact_mobile, contact_phone, contact_email, contact_wecom, custom_fields
            ]
        );
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
        // Join with users table to get poster's name
        const result = await pool.query('SELECT d.id, d.title, d.description, d.budget, d.category, d.tags, d.status, d.posted_date, u.name as posted_by FROM demands d JOIN users u ON d.user_id = u.id ORDER BY posted_date DESC');
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

// Delete a demand
app.delete('/api/demands/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        // Also delete related responses first to maintain referential integrity
        await pool.query('DELETE FROM demand_responses WHERE demand_id = $1', [id]);
        const deleteResult = await pool.query('DELETE FROM demands WHERE id = $1 RETURNING *', [id]);
        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ error: 'Demand not found' });
        }
        res.status(200).json({ message: 'Demand deleted successfully', demand: deleteResult.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Respond to a demand (take an order)
app.post('/api/demands/:id/respond', async (req: Request, res: Response) => {
    const { id: demandId } = req.params;
    // In a real app, supplier_id would come from authenticated session
    const { supplier_id } = req.body; 

    if (!supplier_id) {
        return res.status(400).json({ error: 'supplier_id is required to respond to a demand.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if the demand is still open
        const demandResult = await client.query("SELECT * FROM demands WHERE id = $1 AND status = '开放中' FOR UPDATE", [demandId]);
        if (demandResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Demand not found or is no longer open for responses.' });
        }

        // Add the response
        const responseResult = await client.query(
            'INSERT INTO demand_responses (demand_id, supplier_id) VALUES ($1, $2) RETURNING *',
            [demandId, supplier_id]
        );

        // Update the demand status
        const updateResult = await client.query(
            "UPDATE demands SET status = '洽谈中' WHERE id = $1 RETURNING *",
            [demandId]
        );

        await client.query('COMMIT');

        res.status(201).json({
            response: responseResult.rows[0],
            updatedDemand: updateResult.rows[0],
        });

    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(err);
        // Handle unique constraint violation (supplier already responded)
        if (err.code === '23505') {
            return res.status(409).json({ error: 'This supplier has already responded to this demand.' });
        }
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// --- Public Resources API Endpoints ---

// Get all external links
app.get('/api/external-links', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM external_links ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete an external link
app.delete('/api/external-links/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM external_links WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'External link not found' });
        }
        res.status(200).json({ message: 'External link deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Get all API interfaces
app.get('/api/api-interfaces', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM api_interfaces ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete an API interface
app.delete('/api/api-interfaces/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM api_interfaces WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'API interface not found' });
        }
        res.status(200).json({ message: 'API interface deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
