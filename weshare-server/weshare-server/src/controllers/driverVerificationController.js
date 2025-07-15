const User = require('../models/user');

const submitDriverVerification = async (req, res) => {
    try {
        const { fullName, dateOfBirth, nationalId, vehicleLicensePlate } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!fullName || !dateOfBirth || !nationalId || !vehicleLicensePlate) {
            return res.status(400).json({
                error: 'All fields are required for driver verification'
            });
        }

        // Validate national ID format (16 digits)
        if (!/^\d{16}$/.test(nationalId)) {
            return res.status(400).json({
                error: 'National ID must be exactly 16 digits'
            });
        }

        // Validate license plate format
        if (!/^[A-Z0-9]{2,7}$/.test(vehicleLicensePlate.trim().toUpperCase())) {
            return res.status(400).json({
                error: 'Please enter a valid license plate number (2-7 characters, letters and numbers only)'
            });
        }

        // Check if user is already verified
        const user = await User.findById(userId);
        if (user.verifiedDriver) {
            return res.status(400).json({
                error: 'You are already a verified driver'
            });
        }

        // Update user with driver verification data
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                verifiedDriver: true,
                driverProfile: {
                    fullName: fullName.trim(),
                    dateOfBirth: new Date(dateOfBirth),
                    nationalId: nationalId.trim(),
                    vehicleLicensePlate: vehicleLicensePlate.trim().toUpperCase(),
                    verificationDate: new Date()
                }
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: 'Driver verification submitted successfully',
            user: {
                id: updatedUser._id,
                verifiedDriver: updatedUser.verifiedDriver,
                driverProfile: updatedUser.driverProfile
            }
        });

    } catch (error) {
        console.error('Error in driver verification:', error);
        res.status(500).json({
            error: 'Failed to submit driver verification',
            details: error.message
        });
    }
};

const getDriverProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('verifiedDriver driverProfile');

        res.status(200).json({
            verifiedDriver: user.verifiedDriver,
            driverProfile: user.driverProfile
        });

    } catch (error) {
        console.error('Error fetching driver profile:', error);
        res.status(500).json({
            error: 'Failed to fetch driver profile',
            details: error.message
        });
    }
};

const updateDriverProfile = async (req, res) => {
    try {
        const { fullName, dateOfBirth, nationalId, vehicleLicensePlate } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!fullName || !dateOfBirth || !nationalId || !vehicleLicensePlate) {
            return res.status(400).json({
                error: 'All fields are required for driver profile'
            });
        }

        // Validate national ID format (16 digits)
        if (!/^\d{16}$/.test(nationalId)) {
            return res.status(400).json({
                error: 'National ID must be exactly 16 digits'
            });
        }

        // Validate license plate format
        if (!/^[A-Z0-9]{2,7}$/.test(vehicleLicensePlate.trim().toUpperCase())) {
            return res.status(400).json({
                error: 'Please enter a valid license plate number (2-7 characters, letters and numbers only)'
            });
        }

        // Update user's driver profile
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                driverProfile: {
                    fullName: fullName.trim(),
                    dateOfBirth: new Date(dateOfBirth),
                    nationalId: nationalId.trim(),
                    vehicleLicensePlate: vehicleLicensePlate.trim().toUpperCase(),
                    verificationDate: new Date()
                }
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: 'Driver profile updated successfully',
            driverProfile: updatedUser.driverProfile
        });

    } catch (error) {
        console.error('Error updating driver profile:', error);
        res.status(500).json({
            error: 'Failed to update driver profile',
            details: error.message
        });
    }
};

module.exports = {
    submitDriverVerification,
    getDriverProfile,
    updateDriverProfile
}; 