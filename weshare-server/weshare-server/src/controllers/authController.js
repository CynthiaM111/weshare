const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Agency = require('../models/agency');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

// Signup
const signup = async (req, res) => {
    try {
        const { email, password, role, name, contact_number, address } = req.body;

        // Validate required fields
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        if (role === 'agency') {
            const agency = new Agency({
                name,
                email,
                password: hashedPassword,
                contact_number,
                address,
                role: 'agency',
            });
            await agency.save();
            return res.status(201).json({ message: 'Agency created successfully' });
        } else {
            // Default to normal user
            const user = new User({ name, email, password: hashedPassword, role: 'user' });
            await user.save();
            return res.status(201).json({ message: 'User created successfully. Please use the mobile app to log in.' });
        }
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Signup failed', details: error.message });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check Agency first
        let user = await Agency.findOne({ email });
        let role = 'agency';
        if (!user) {
            // If not agency, check User
            user = await User.findOne({ email });
            role = 'user';
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, role }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token, role });
    } catch (error) {
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
};

// Middleware to protect routes
const protect = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Expect "Bearer <token>"
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, role }
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Restrict to agency only
const agencyOnly = (req, res, next) => {
    if (req.user.role !== 'agency') {
        return res.status(403).json({ error: 'Access denied. Agency only.' });
    }
    next();
};

module.exports = { signup, login, protect, agencyOnly };