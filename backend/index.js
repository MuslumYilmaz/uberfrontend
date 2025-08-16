require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// ---- Config ----
const PORT = process.env.PORT || 3001;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/myapp';

// ---- DB ----
mongoose.connect(MONGO_URL);
mongoose.connection.on('connected', () => console.log('✅ MongoDB connected'));
mongoose.connection.on('error', (err) => console.error('❌ MongoDB error:', err));

// ---- Middleware ----
app.use(
    cors({
        origin: 'http://localhost:4200', // your Angular dev URL
        // credentials: false, // not needed since we return token in JSON
    })
);
app.use(express.json());

// ---- Models ----
const User = require('./models/User');

// ---- Routes (basic) ----
app.get('/', (_, res) => res.send('Backend is working 🚀'));
app.get('/api/hello', (_, res) => res.json({ message: 'Hello from backend 👋' }));

// ---- Profile routes (keep) ----
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-passwordHash');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        // never allow passwordHash to be set through this route
        if ('passwordHash' in req.body) delete req.body.passwordHash;

        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        }).select('-passwordHash');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ---- Auth routes ----
app.use('/api/auth', require('./routes/auth'));

// ---- Start ----
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
