// ========================================
// EXPRESS SERVER FOR GUEST LIST API
// Designed to be easily migrated to Supabase/MongoDB
// ========================================

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const GUESTS_FILE = path.join(__dirname, 'public', 'guests', 'guests.json');
const PAGES_DIR = path.join(__dirname, 'pages');
const isProduction = process.env.NODE_ENV === 'production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'graduation';

const serveAdminPage = (req, res) => {
    res.sendFile(path.join(PAGES_DIR, 'guests-admin.html'));
};

const serveMainPage = (req, res) => {
    res.sendFile(path.join(PAGES_DIR, 'main.html'));
};

const requireAdminAuth = (req, res, next) => {
    if (!isProduction) {
        return next();
    }

    const authHeader = req.headers.authorization || '';
    const [scheme, encoded] = authHeader.split(' ');

    if (scheme === 'Basic' && encoded) {
        const decoded = Buffer.from(encoded, 'base64').toString();
        const [username, password] = decoded.split(':');

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            return next();
        }
    }

    res.set('WWW-Authenticate', 'Basic realm=\"Admin Area\"');
    return res.status(401).send('Authentication required');
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

if (isProduction) {
    app.use('/api', requireAdminAuth);
}

app.get('/admin', requireAdminAuth, serveAdminPage);

app.get('/', (req, res) => {
    if (!isProduction && req.hostname === 'admin.localhost') {
        return serveAdminPage(req, res);
    }

    return serveMainPage(req, res);
});

// ========================================
// API ROUTES
// ========================================

// GET /api/guests - Fetch all guests
app.get('/api/guests', async (req, res) => {
    try {
        const data = await fs.readFile(GUESTS_FILE, 'utf8');
        const guests = JSON.parse(data);
        res.json(guests);
    } catch (error) {
        console.error('Error reading guests file:', error);
        res.status(500).json({ error: 'Failed to read guest data' });
    }
});

// PUT /api/guests - Update guest list
app.put('/api/guests', async (req, res) => {
    try {
        const guestData = req.body;
        
        // Validate structure
        if (!guestData.categories || !Array.isArray(guestData.categories)) {
            return res.status(400).json({ error: 'Invalid guest data structure' });
        }

        // Update metadata
        guestData.metadata = guestData.metadata || {};
        guestData.metadata.lastUpdated = new Date().toISOString();
        
        // Calculate total expected guests
        const totalExpected = guestData.categories.reduce((sum, category) => {
            return sum + (category.guests || []).reduce((catSum, guest) => {
                return catSum + (guest.expectedCount || 0);
            }, 0);
        }, 0);
        guestData.metadata.totalExpectedGuests = totalExpected;

        // Write to file
        await fs.writeFile(GUESTS_FILE, JSON.stringify(guestData, null, 2), 'utf8');
        
        res.json({ 
            success: true, 
            message: 'Guest list updated successfully',
            data: guestData 
        });
    } catch (error) {
        console.error('Error writing guests file:', error);
        res.status(500).json({ error: 'Failed to update guest data' });
    }
});

// POST /api/guests/category - Add new category
app.post('/api/guests/category', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const data = await fs.readFile(GUESTS_FILE, 'utf8');
        const guests = JSON.parse(data);
        
        guests.categories.push({
            name: name.trim(),
            guests: []
        });

        await fs.writeFile(GUESTS_FILE, JSON.stringify(guests, null, 2), 'utf8');
        res.json({ success: true, data: guests });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ error: 'Failed to add category' });
    }
});

// DELETE /api/guests/category/:index - Delete category
app.delete('/api/guests/category/:index', async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const data = await fs.readFile(GUESTS_FILE, 'utf8');
        const guests = JSON.parse(data);
        
        if (index < 0 || index >= guests.categories.length) {
            return res.status(400).json({ error: 'Invalid category index' });
        }

        guests.categories.splice(index, 1);
        await fs.writeFile(GUESTS_FILE, JSON.stringify(guests, null, 2), 'utf8');
        res.json({ success: true, data: guests });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// POST /api/guests/:categoryIndex - Add guest to category
app.post('/api/guests/:categoryIndex', async (req, res) => {
    try {
        const categoryIndex = parseInt(req.params.categoryIndex);
        const guest = req.body;
        
        if (!guest.name || !guest.expectedCount) {
            return res.status(400).json({ error: 'Guest name and expected count are required' });
        }

        const data = await fs.readFile(GUESTS_FILE, 'utf8');
        const guests = JSON.parse(data);
        
        if (categoryIndex < 0 || categoryIndex >= guests.categories.length) {
            return res.status(400).json({ error: 'Invalid category index' });
        }

        guests.categories[categoryIndex].guests.push({
            name: guest.name.trim(),
            phone: guest.phone || null,
            expectedCount: parseInt(guest.expectedCount),
            isExact: guest.isExact || false,
            notes: guest.notes || null
        });

        await fs.writeFile(GUESTS_FILE, JSON.stringify(guests, null, 2), 'utf8');
        res.json({ success: true, data: guests });
    } catch (error) {
        console.error('Error adding guest:', error);
        res.status(500).json({ error: 'Failed to add guest' });
    }
});

// PUT /api/guests/:categoryIndex/:guestIndex - Update guest
app.put('/api/guests/:categoryIndex/:guestIndex', async (req, res) => {
    try {
        const categoryIndex = parseInt(req.params.categoryIndex);
        const guestIndex = parseInt(req.params.guestIndex);
        const guest = req.body;
        
        if (!guest.name || !guest.expectedCount) {
            return res.status(400).json({ error: 'Guest name and expected count are required' });
        }

        const data = await fs.readFile(GUESTS_FILE, 'utf8');
        const guests = JSON.parse(data);
        
        if (categoryIndex < 0 || categoryIndex >= guests.categories.length) {
            return res.status(400).json({ error: 'Invalid category index' });
        }
        
        if (guestIndex < 0 || guestIndex >= guests.categories[categoryIndex].guests.length) {
            return res.status(400).json({ error: 'Invalid guest index' });
        }

        guests.categories[categoryIndex].guests[guestIndex] = {
            name: guest.name.trim(),
            phone: guest.phone || null,
            expectedCount: parseInt(guest.expectedCount),
            isExact: guest.isExact || false,
            notes: guest.notes || null
        };

        await fs.writeFile(GUESTS_FILE, JSON.stringify(guests, null, 2), 'utf8');
        res.json({ success: true, data: guests });
    } catch (error) {
        console.error('Error updating guest:', error);
        res.status(500).json({ error: 'Failed to update guest' });
    }
});

// DELETE /api/guests/:categoryIndex/:guestIndex - Delete guest
app.delete('/api/guests/:categoryIndex/:guestIndex', async (req, res) => {
    try {
        const categoryIndex = parseInt(req.params.categoryIndex);
        const guestIndex = parseInt(req.params.guestIndex);
        
        const data = await fs.readFile(GUESTS_FILE, 'utf8');
        const guests = JSON.parse(data);
        
        if (categoryIndex < 0 || categoryIndex >= guests.categories.length) {
            return res.status(400).json({ error: 'Invalid category index' });
        }
        
        if (guestIndex < 0 || guestIndex >= guests.categories[categoryIndex].guests.length) {
            return res.status(400).json({ error: 'Invalid guest index' });
        }

        guests.categories[categoryIndex].guests.splice(guestIndex, 1);
        await fs.writeFile(GUESTS_FILE, JSON.stringify(guests, null, 2), 'utf8');
        res.json({ success: true, data: guests });
    } catch (error) {
        console.error('Error deleting guest:', error);
        res.status(500).json({ error: 'Failed to delete guest' });
    }
});

// ========================================
// SERVER START
// ========================================

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🏡 Main site: http://localhost:${PORT}/`);
    console.log(`🛠️  Admin (local): http://admin.localhost:${PORT}/`);
    console.log(`🔐 Admin (production): https://<your-domain>/admin`);
    console.log(`📄 Guest data file: ${GUESTS_FILE}`);
});

