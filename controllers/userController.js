import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// POST /api/users/register
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

// POST /api/users/login
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
