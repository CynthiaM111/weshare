const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Agency = require('../models/agency');
const DestinationCategory = require('../models/destinationCategory');
// const smsService = require('../services/smsService');
const crypto = require('crypto');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;
const AfricasTalking = require('africastalking');

const africastalking = AfricasTalking({
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: 'sandbox'
});

// Generate verification code
const generateVerificationCode = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// Signup
const signup = async (req, res) => {
    try {
        const { email, password, role, name, contact_number, agencyId, destinationCategoryId, address } = req.body;

        // Validate required fields
        if (!contact_number || !password || !name) {
            return res.status(400).json({ error: 'Contact number, password, and name are required' });
        }

        // Validate Rwandan phone number
        const rwPhoneRegex = /^\+2507[2389]\d{7}$/
        if (!rwPhoneRegex.test(contact_number)) {
            return res.status(400).json({ error: 'Invalid Rwandan phone number' });
        }

        // Check for existing user
        const existingUser = await User.findOne({ contact_number });
        if (existingUser) {
            return res.status(400).json({ error: 'A user with this contact number already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        if (role === 'agency') {
            const agency = new Agency({
                name,
                email,
                password: hashedPassword,
                contact_number,
                address: address || '',
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
                destinationCategoryId,
                isVerified: false,
                verificationCode,
                verificationCodeExpires
            });
            await user.save();

            // Send verification SMS
            try {
                await africastalking.SMS.send({
                    to: [contact_number],
                    message: `Your verification code is ${verificationCode}. It will expire in 5 minutes.`,
                    from: 'WeShare'
                });
                return res.status(201).json({
                    message: 'Agency employee created successfully. Please verify your phone number.',
                    requiresVerification: true
                });
            } catch (smsError) {
                console.error('SMS sending failed:', smsError);
                return res.status(201).json({
                    message: 'Agency employee created successfully but verification SMS could not be sent.',
                    requiresVerification: true
                });
            }
        } else {
            // Default to normal user
            const user = new User({
                name,
                email,
                password: hashedPassword,
                role: 'user',
                contact_number,
                isVerified: false,
                verificationCode,
                verificationCodeExpires
            });
            await user.save();

            // Send verification SMS
            try {
                await africastalking.SMS.send({
                    to: [contact_number],
                    message: `Your verification code is ${verificationCode}. It will expire in 5 minutes.`,
                    from: 'WeShare'
                });
                return res.status(201).json({
                    message: 'User created successfully. Please verify your phone number.',
                    requiresVerification: true
                });
            } catch (smsError) {
                console.error('SMS sending failed:', smsError);
                return res.status(201).json({
                    message: 'User created successfully but verification SMS could not be sent.',
                    requiresVerification: true
                });
            }
        }
    } catch (error) {
        console.error('Signup error:', error);
        if (error.code === 11000) {
            // This is a MongoDB duplicate key error
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                error: `${field} already exists`,
                details: error.keyPattern
            });
        }
        res.status(500).json({ error: 'Signup failed', details: error.message });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { contact_number, password, email } = req.body;

        // Check Agency first (using email)
        let user = await Agency.findOne({ email });
        let role = 'agency';

        if (!user) {
            // If not agency, check User (using contact number)
            if (!contact_number) {
                return res.status(400).json({ error: 'Contact number is required for user login' });
            }
            user = await User.findOne({ contact_number });
            role = user ? user.role : null;
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
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
        const responseData = {
            message: 'Login successful',
            token,
            role,
            userId: user._id,
            email: user.email,
            name: user.name,
            contact_number: user.contact_number,
        };

        if (role === 'agency_employee') {
            responseData.agencyId = user.agencyId;
            responseData.destinationCategoryId = user.destinationCategoryId;
            responseData.isVerified = user.isVerified;
        } else if (role === 'user') {
            responseData.isVerified = user.isVerified;
        }

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Login error:', error);
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
            contact_number: user.contact_number,
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

// Verify phone number
const verifyPhone = async (req, res) => {
    try {
        const { contact_number, verificationCode } = req.body;
        console.log('Verification attempt:', { contact_number, verificationCode });

        if (!contact_number || !verificationCode) {
            console.log('Missing required fields:', { contact_number, verificationCode });
            return res.status(400).json({ error: 'Contact number and verification code are required' });
        }

        // Check both User and Agency models
        let user = await User.findOne({ contact_number });
        console.log('User lookup result:', {
            found: !!user,
            userId: user?._id,
            isVerified: user?.isVerified,
            hasVerificationCode: !!user?.verificationCode,
            verificationCodeExpires: user?.verificationCodeExpires
        });

        let agency = null;
        if (!user) {
            agency = await Agency.findOne({ contact_number });
            console.log('Agency lookup result:', {
                found: !!agency,
                agencyId: agency?._id,
                isVerified: agency?.isVerified,
                hasVerificationCode: !!agency?.verificationCode,
                verificationCodeExpires: agency?.verificationCodeExpires
            });
        }

        const account = user || agency;
        if (!account) {
            console.log('No account found for contact number:', contact_number);
            return res.status(404).json({ error: 'Account not found' });
        }

        if (account.isVerified) {
            console.log('Account already verified:', {
                accountType: user ? 'user' : 'agency',
                accountId: account._id
            });
            return res.status(400).json({ error: 'Account is already verified' });
        }

        if (account.verificationCode !== verificationCode) {
            console.log('Invalid verification code:', {
                provided: verificationCode,
                expected: account.verificationCode,
                accountType: user ? 'user' : 'agency',
                accountId: account._id
            });
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        if (account.verificationCodeExpires < new Date()) {
            console.log('Verification code expired:', {
                expires: account.verificationCodeExpires,
                now: new Date(),
                accountType: user ? 'user' : 'agency',
                accountId: account._id
            });
            return res.status(400).json({ error: 'Verification code has expired' });
        }

        // Mark as verified
        account.isVerified = true;
        account.verificationCode = undefined;
        account.verificationCodeExpires = undefined;
        await account.save();
        console.log('Account verified successfully:', {
            accountType: user ? 'user' : 'agency',
            accountId: account._id
        });

        // Send welcome SMS
        try {
            await africastalking.SMS.send({
                to: [contact_number],
                message: `Welcome to WeShare, ${account.name}`,
                from: 'WeShare'
            });
            console.log('Welcome SMS sent successfully to:', contact_number);
        } catch (smsError) {
            console.error('Welcome SMS sending failed:', {
                error: smsError.message,
                stack: smsError.stack,
                contact_number
            });
        }

        res.status(200).json({ message: 'Phone number verified successfully' });
    } catch (error) {
        console.error('Verification failed:', {
            error: error.message,
            stack: error.stack,
            contact_number: req.body.contact_number
        });
        res.status(500).json({ error: 'Verification failed', details: error.message });
    }
};

// Resend verification code
const resendVerificationCode = async (req, res) => {
    try {
        const { contact_number } = req.body;
        console.log('Resend verification code attempt:', { contact_number });

        if (!contact_number) {
            console.log('Missing contact number in request');
            return res.status(400).json({ error: 'Contact number is required' });
        }

        // Check both User and Agency models
        let user = await User.findOne({ contact_number });
        console.log('User lookup result:', {
            found: !!user,
            userId: user?._id,
            isVerified: user?.isVerified
        });

        let agency = null;
        if (!user) {
            agency = await Agency.findOne({ contact_number });
            console.log('Agency lookup result:', {
                found: !!agency,
                agencyId: agency?._id,
                isVerified: agency?.isVerified
            });
        }

        const account = user || agency;
        if (!account) {
            console.log('No account found for contact number:', contact_number);
            return res.status(404).json({ error: 'Account not found' });
        }

        if (account.isVerified) {
            console.log('Account already verified:', {
                accountType: user ? 'user' : 'agency',
                accountId: account._id
            });
            return res.status(400).json({ error: 'Account is already verified' });
        }

        // Generate new verification code
        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        console.log('Generated new verification code:', {
            expires: verificationCodeExpires,
            accountType: user ? 'user' : 'agency',
            accountId: account._id
        });

        account.verificationCode = verificationCode;
        account.verificationCodeExpires = verificationCodeExpires;
        await account.save();
        console.log('Updated account with new verification code:', {
            accountType: user ? 'user' : 'agency',
            accountId: account._id
        });

        // Send new verification SMS
        try {
            await africastalking.SMS.send({
                to: [contact_number],
                message: `Your verification code is ${verificationCode}. It will expire in 5 minutes.`,
                from: 'WeShare'
            });
            console.log('Verification SMS sent successfully to:', contact_number);
            res.status(200).json({ message: 'New verification code sent successfully' });
        } catch (smsError) {
            console.error('SMS sending failed:', {
                error: smsError.message,
                stack: smsError.stack,
                contact_number
            });
            res.status(500).json({ error: 'Failed to send verification code' });
        }
    } catch (error) {
        console.error('Resend verification code failed:', {
            error: error.message,
            stack: error.stack,
            contact_number: req.body.contact_number
        });
        res.status(500).json({ error: 'Failed to resend verification code', details: error.message });
    }
};

const sendOTP = async (req, res) => {




    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const message = `Your verification code is ${otp}. It will expire in 5 minutes.`;

    try {
        const result = await africastalking.SMS.send({
            to: [phoneNumber],
            message: message,
            from: 'WeShare'
        });

        console.log('SMS Result:', result);

        // TODO: Save the OTP and phone number to Redis or DB if needed
        res.status(200).json({ success: true, message: 'OTP sent successfully', otp });
    } catch (error) {
        console.error('SMS Send Error:', error);
        res.status(500).json({ success: false, error: 'Failed to send OTP' });
    }
};

module.exports = { signup, login, protect, agencyOnly, status, employeeOnly, getAgencies, getAgencyCategories, getAgencyById, getDestinationCategoryById, verifyPhone, resendVerificationCode, sendOTP };