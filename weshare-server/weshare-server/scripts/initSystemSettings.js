const mongoose = require('mongoose');
const SystemSettings = require('../src/models/systemSettings');
require('dotenv').config();

async function initializeSystemSettings() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');

        // Check if settings already exist
        const existingSettings = await SystemSettings.findOne();

        if (existingSettings) {
            console.log('System settings already exist:');
            console.log(`- Fuel Price: ${existingSettings.fuelPricePerLiter} RWF/L`);
            console.log(`- Fuel Efficiency Range: ${existingSettings.fuelEfficiencyMin}-${existingSettings.fuelEfficiencyMax} L/100km`);
            console.log(`- Last Updated: ${existingSettings.updatedAt}`);
            return;
        }

        // Create default settings
        const defaultSettings = new SystemSettings({
            fuelPricePerLiter: 1700,
            fuelEfficiencyMin: 6.0,
            fuelEfficiencyMax: 10.0,
            lastUpdatedBy: null // Will be set when first updated by admin
        });

        await defaultSettings.save();

        console.log('System settings initialized successfully:');
        console.log(`- Fuel Price: ${defaultSettings.fuelPricePerLiter} RWF/L`);
        console.log(`- Fuel Efficiency Range: ${defaultSettings.fuelEfficiencyMin}-${defaultSettings.fuelEfficiencyMax} L/100km`);

    } catch (error) {
        console.error('Error initializing system settings:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the initialization
initializeSystemSettings(); 