import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Business logic for the user endpoints.
 *
 * Connections:
 * - Imported by `routes/userRoutes.js`, which maps each HTTP route to one
 *   of these functions (`register`, `login`).
 * - Imports the `User` model (`../models/User.js`) for DB access. Password
 *   hashing is NOT done here — the model's `pre('save')` hook hashes
 *   automatically on `user.save()`, and `user.isCorrectPassword()` verifies
 *   on login. Controllers only orchestrate: validate → query → respond.
 * - Imports `jsonwebtoken` to sign tokens on successful login, using
 *   `process.env.JWT_SECRET` (loaded from `.env` by `server.js`).
 */

/**
 * Registers a new user.
 *
 * Flow:
 * 1. Read `username`, `email`, `password` from `req.body` (parsed by
 *    `express.json()` in `server.js`); 400 if any is missing.
 * 2. `User.findOne({ email })` — 400 if the email is already taken.
 * 3. `new User(...)` + `save()` — the model's pre-save hook hashes the
 *    password; then respond 201 with the user (the model's `toJSON()`
 *    strips the hash automatically).
 *
 * @param {import('express').Request} req - Express request (expects JSON body).
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<import('express').Response>} 201 + user, 400 on bad input/duplicate, 500 on server error.
 */
export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Username, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'User with this email already exists.' });
    }

    const user = new User({ username, email, password });
    await user.save();

    return res.status(201).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * Authenticates a returning user and issues a JWT.
 *
 * Flow:
 * 1. Read `email`, `password` from `req.body`; 400 (generic) if missing.
 * 2. `User.findOne({ email })` — 400 generic if no user found.
 * 3. `user.isCorrectPassword(password)` — 400 generic if it doesn't match.
 * 4. `jwt.sign({ _id, username }, JWT_SECRET, { expiresIn: '1h' })` —
 *    the payload holds only non-sensitive data (never the password hash);
 *    respond 200 with `{ token, user }`.
 *
 * Why the same generic message (`"Incorrect email or password."`) in every
 * failure case: telling the client whether the email exists would let
 * attackers enumerate registered accounts. A single message leaks nothing.
 *
 * @param {import('express').Request} req - Express request (expects JSON body).
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<import('express').Response>} 200 + `{ token, user }`, 400 on bad credentials, 500 on server error.
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Incorrect email or password.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: 'Incorrect email or password.' });
    }

    const isMatch = await user.isCorrectPassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: 'Incorrect email or password.' });
    }

    const token = jwt.sign(
      { _id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ token, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}
