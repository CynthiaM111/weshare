const SystemSettings = require('../models/systemSettings');

// Get public system settings (fuel price and efficiency ranges)
const getPublicSystemSettings = async (req, res) => {
    try {
        const settings = await SystemSettings.getCurrentSettings();

        // Only return the settings that users need for ride creation
        res.json({
            success: true,
            settings: {
                fuelPricePerLiter: settings.fuelPricePerLiter,
                fuelEfficiencyMin: settings.fuelEfficiencyMin,
                fuelEfficiencyMax: settings.fuelEfficiencyMax
            }
        });
    } catch (error) {
        console.error('Error fetching public system settings:', error);
        res.status(500).json({ error: 'Failed to fetch system settings' });
    }
};

module.exports = {
    getPublicSystemSettings
}; 