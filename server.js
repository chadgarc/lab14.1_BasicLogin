import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';

/**
 * Entry point — Innovate Inc. Auth API.
 *
 * Startup order matters (top to bottom):
 * 1. `dotenv.config()` FIRST — loads `MONGO_URI`, `JWT_SECRET`, `PORT`
 *    from `.env` so every module below can read `process.env`.
 * 2. `express.json()` BEFORE the routes — parses JSON bodies, otherwise
 *    `req.body` in the controllers would be `undefined`.
 * 3. `app.use('/api/users', userRoutes)` — mounts the user router; see
 *    `routes/userRoutes.js` for the route map.
 * 4. `start()` — validates env vars, connects to MongoDB via Mongoose,
 *    and only then calls `app.listen()`. The server never accepts traffic
 *    without a working database connection.
 *
 * Connections: `routes/userRoutes.js` → `controllers/userController.js` →
 * `models/User.js`. This file only wires them together.
 */
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Innovate Inc. Auth API running' });
});

app.use('/api/users', userRoutes);

/**
 * Boots the API: validates config, connects to MongoDB, starts listening.
 *
 * Fails fast with a clear message if `.env` is missing `MONGO_URI` or
 * `JWT_SECRET`, instead of crashing later on the first request.
 *
 * @returns {Promise<void>} Resolves once the server is listening.
 */
async function start() {
    try {
        if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not defined in .env');
        }
        if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in .env');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err.message);
        process.exit(1);
    }
}

start();
