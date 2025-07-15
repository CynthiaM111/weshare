const User = require('../models/user');

const migrateExistingUsers = async () => {
    try {
        // Mark all existing users as verified drivers
        const result = await User.updateMany(
            { verifiedDriver: { $ne: true } },
            { 
                verifiedDriver: true,
                'driverProfile.verificationDate': new Date()
            }
        );
        
        console.log(`Migrated ${result.modifiedCount} users to verified drivers`);
    } catch (error) {
        console.error('Migration failed:', error);
    }
};

// Run this script once
migrateExistingUsers();