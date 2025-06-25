const Agency = require('../models/agency'); 

// POST /agencies - Create a new agency
const createAgency = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const agency = new Agency({ name, email, password });
        await agency.save();
        res.status(201).json({ message: 'Agency created successfully', agency });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create agency', details: error.message });
    }
};

// GET /agencies - Get all agencies
const getAgencies = async (req, res) => {
    try {
        const agencies = await Agency.find();
        res.status(200).json(agencies);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get agencies', details: error.message });
    }
};

module.exports = { createAgency, getAgencies };