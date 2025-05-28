const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Agency = require('../models/agency');
const DestinationCategory = require('../models/destinationCategory');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

// Signup
const signup = async (req, res) => {
    try {
        const { email, password, role, name, contact_number, agencyId, destinationCategoryId } = req.body;

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
        } else if (role === 'agency_employee') {
            if (!agencyId || !destinationCategoryId || !contact_number) {
                return res.status(400).json({ error: 'Agency, destination category, and contact number are required for employees' });
            }
            const agency = await Agency.findById(agencyId);
            if (!agency) {
                return res.status(400).json({ error: 'Invalid agency' });
            }
            const category = await DestinationCategory.findOne({ _id: destinationCategoryId, agencyId });
            if (!category) {
                return res.status(400).json({ error: 'Invalid destination category' });
            }
            const user = new User({
                name,
                email,
                password: hashedPassword,
                role: 'agency_employee',
                contact_number,
                agencyId,
                destinationCategoryId
            });
            await user.save();
            return res.status(201).json({ message: 'Agency employee created successfully. Please use the mobile app to log in.' });
        } else {
            // Default to normal user
            const user = new User({ name, email, password: hashedPassword, role: 'user', contact_number });
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
            role = user ? user.role : null;
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const tokenPayload = {
            id: user._id,
            role,
        };

        if (role === 'agency_employee') {
            tokenPayload.destinationCategoryId = user.destinationCategoryId;
            tokenPayload.agencyId = user.agencyId;
        }

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({
            message: 'Login successful', 
            token, 
            role, 
            userId: user._id, 
            email: user.email, 
            name: user.name,
            agencyId: role === 'agency_employee' ? user.agencyId : null,
            destinationCategoryId: role === 'agency_employee' ? user.destinationCategoryId : null });
    } catch (error) {
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
};
const status = async (req, res) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ isAuthenticated: false });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user exists (either agency or regular user)
        let user;
        if (decoded.role === 'agency') {
            user = await Agency.findById(decoded.id);
        } else {
            user = await User.findById(decoded.id);
        }

        if (!user) {
            return res.status(401).json({ isAuthenticated: false });
        }

        // Return minimal user info and auth status
        res.status(200).json({
            isAuthenticated: true,
            role: decoded.role,
            userId: user._id,
            email: user.email,
            name: user.name,
            agencyId: decoded.role === 'agency_employee' ? user.agencyId : null,
            destinationCategoryId: decoded.role === 'agency_employee' ? user.destinationCategoryId : null
        });
    } catch (error) {
        // Token is invalid or expired
        res.status(200).json({ isAuthenticated: false });
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

// Updated: Restrict to agency employee only
const employeeOnly = (req, res, next) => {
    if (req.user.role !== 'agency_employee') {
        return res.status(403).json({ error: 'Access denied. Agency employee only.' });
    }
    next();
};

// Updated: Fetch agencies for signup
const getAgencies = async (req, res) => {
    try {
        const agencies = await Agency.find({}, 'name _id');
        res.status(200).json(agencies);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch agencies', details: error.message });
    }
};

// Updated: Fetch destination categories for an agency
const getAgencyCategories = async (req, res) => {
    try {
        const { agencyId } = req.params;
        const categories = await DestinationCategory.find({ agencyId }, 'from to _id');
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
    }
};

const getAgencyById = async (req, res) => {
    try {
        const agency = await Agency.findById(req.params.agencyId, 'name');
        if (!agency) return res.status(404).json({ error: 'Agency not found' });
        res.status(200).json(agency);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch agency' });
    }
};

const getDestinationCategoryById = async (req, res) => {
    try {
        const category = await DestinationCategory.findOne({
            _id: req.params.categoryId,
            agencyId: req.params.agencyId
        }, 'from to');
        if (!category) return res.status(404).json({ error: 'Category not found' });
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch category' });
    }
};
module.exports = { signup, login, protect, agencyOnly, status, employeeOnly, getAgencies, getAgencyCategories, getAgencyById, getDestinationCategoryById };