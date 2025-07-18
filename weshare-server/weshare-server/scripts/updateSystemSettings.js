const mongoose = require('mongoose');
const SystemSettings = require('../src/models/systemSettings');
require('dotenv').config();

async function updateSystemSettings() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');

        // Find existing settings
        const existingSettings = await SystemSettings.findOne();

        if (!existingSettings) {
            console.log('No system settings found. Run initSystemSettings.js first.');
            return;
        }

        console.log('Current system settings:');
        console.log(`- Fuel Price: ${existingSettings.fuelPricePerLiter} RWF/L`);
        console.log(`- Fuel Efficiency Range: ${existingSettings.fuelEfficiencyMin}-${existingSettings.fuelEfficiencyMax} L/100km`);

        // Update to correct range
        existingSettings.fuelEfficiencyMin = 6.0;
        existingSettings.fuelEfficiencyMax = 10.0;

        // Keep the current fuel price
        console.log(`- Keeping current fuel price: ${existingSettings.fuelPricePerLiter} RWF/L`);

        await existingSettings.save();

        console.log('\nSystem settings updated successfully:');
        console.log(`- Fuel Price: ${existingSettings.fuelPricePerLiter} RWF/L`);
        console.log(`- Fuel Efficiency Range: ${existingSettings.fuelEfficiencyMin}-${existingSettings.fuelEfficiencyMax} L/100km`);

    } catch (error) {
        console.error('Error updating system settings:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the update
updateSystemSettings(); 