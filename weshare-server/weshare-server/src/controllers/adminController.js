const User = require('../models/user');
const Agency = require('../models/agency');
const Ride = require('../models/ride');

// Get all users with pagination and filtering
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 50, role, status, search } = req.query;

        // Build filter object
        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { contact_number: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get users with pagination
        const users = await User.find(filter)
            .select('-password -verificationCode -verificationCodeExpires')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('agencyId', 'name')
            .populate('destinationCategoryId', 'from to');

        // Get total count for pagination
        const total = await User.countDocuments(filter);

        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Get all agencies with pagination and filtering
const getAllAgencies = async (req, res) => {
    try {
        const { page = 1, limit = 50, search } = req.query;

        // Build filter object
        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { contact_number: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get agencies with pagination
        const agencies = await Agency.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Agency.countDocuments(filter);

        res.json({
            agencies,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching agencies:', error);
        res.status(500).json({ error: 'Failed to fetch agencies' });
    }
};

// Get all private rides with driver information and booking details
const getAllPrivateRides = async (req, res) => {
    try {
        const { page = 1, limit = 50, search, status } = req.query;

        // Build filter object
        const filter = { isPrivate: true };
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { from: { $regex: search, $options: 'i' } },
                { to: { $regex: search, $options: 'i' } },
                { licensePlate: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get private rides with pagination and populate driver info
        const rides = await Ride.find(filter)
            .populate('userId', 'name email contact_number photoUrl')
            .populate('bookedBy.userId', 'name email contact_number photoUrl')
            .sort({ departure_time: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Transform rides to include booking statistics and handle null drivers
        const ridesWithStats = rides.map(ride => {
            const totalBookings = ride.bookedBy.length;
            const completedBookings = ride.bookedBy.filter(booking =>
                booking.checkInStatus === 'completed'
            ).length;
            const pendingBookings = ride.bookedBy.filter(booking =>
                booking.checkInStatus === 'pending'
            ).length;
            const availableSeats = ride.seats - ride.booked_seats;

            return {
                ...ride,
                driver: ride.userId || {
                    _id: 'unknown',
                    name: 'Unknown Driver',
                    email: 'No email',
                    contact_number: 'No contact',
                    photoUrl: null
                },
                totalBookings,
                completedBookings,
                pendingBookings,
                availableSeats,
                occupancyRate: ride.seats > 0 ? (ride.booked_seats / ride.seats) * 100 : 0
            };
        });

        // Get total count for pagination
        const total = await Ride.countDocuments(filter);

        res.json({
            rides: ridesWithStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching private rides:', error);
        res.status(500).json({ error: 'Failed to fetch private rides' });
    }
};

// Update user status (active/suspended)
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'suspended'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be "active" or "suspended"' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent suspending super admin users
        if (user.role === 'super_admin' && status === 'suspended') {
            return res.status(403).json({ error: 'Cannot suspend super admin users' });
        }

        user.status = status;
        await user.save();

        // Remove sensitive fields from response
        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.verificationCode;
        delete userResponse.verificationCodeExpires;

        res.json({
            message: 'User status updated successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deleting super admin users
        if (user.role === 'super_admin') {
            return res.status(403).json({ error: 'Cannot delete super admin users' });
        }

        // Check if user has active bookings
        const activeBookings = await Ride.find({
            'bookedBy.userId': id,
            status: { $in: ['scheduled', 'in_progress'] }
        });

        if (activeBookings.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete user with active bookings. Please cancel bookings first.'
            });
        }

        await User.findByIdAndDelete(id);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

// Get system statistics
const getSystemStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        // Get user statistics
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ status: 'active' });
        const suspendedUsers = await User.countDocuments({ status: 'suspended' });
        const agencyEmployees = await User.countDocuments({ role: 'agency_employee' });
        const superAdmins = await User.countDocuments({ role: 'super_admin' });

        // Get user statistics by role
        const usersByRole = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        // Get agency statistics
        const totalAgencies = await Agency.countDocuments();

        // Get ride statistics
        const totalRides = await Ride.countDocuments(dateFilter);
        const completedRides = await Ride.countDocuments({
            ...dateFilter,
            status: 'completed'
        });
        const activeRides = await Ride.countDocuments({
            status: { $in: ['scheduled', 'in_progress'] }
        });

        // Get private ride statistics
        const totalPrivateRides = await Ride.countDocuments({
            ...dateFilter,
            isPrivate: true
        });
        const activePrivateRides = await Ride.countDocuments({
            isPrivate: true,
            status: 'active'
        });
        const completedPrivateRides = await Ride.countDocuments({
            isPrivate: true,
            status: 'completed'
        });

        // Get booking statistics
        const totalBookings = await Ride.aggregate([
            { $unwind: '$bookedBy' },
            { $count: 'total' }
        ]);

        const completedBookings = await Ride.aggregate([
            { $unwind: '$bookedBy' },
            { $match: { 'bookedBy.checkInStatus': 'completed' } },
            { $count: 'total' }
        ]);

        // Get private booking statistics
        const totalPrivateBookings = await Ride.aggregate([
            { $match: { isPrivate: true } },
            { $unwind: '$bookedBy' },
            { $count: 'total' }
        ]);

        const completedPrivateBookings = await Ride.aggregate([
            { $match: { isPrivate: true } },
            { $unwind: '$bookedBy' },
            { $match: { 'bookedBy.checkInStatus': 'completed' } },
            { $count: 'total' }
        ]);

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentUsers = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        const recentRides = await Ride.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        const recentAgencies = await Agency.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        const recentPrivateRides = await Ride.countDocuments({
            isPrivate: true,
            createdAt: { $gte: sevenDaysAgo }
        });

        const stats = {
            users: {
                total: totalUsers,
                active: activeUsers,
                suspended: suspendedUsers,
                byRole: {
                    user: usersByRole.find(r => r._id === 'user')?.count || 0,
                    agency_employee: agencyEmployees,
                    super_admin: superAdmins
                },
                recent: recentUsers
            },
            agencies: {
                total: totalAgencies,
                recent: recentAgencies
            },
            rides: {
                total: totalRides,
                completed: completedRides,
                active: activeRides,
                recent: recentRides
            },
            privateRides: {
                total: totalPrivateRides,
                active: activePrivateRides,
                completed: completedPrivateRides,
                recent: recentPrivateRides
            },
            bookings: {
                total: totalBookings[0]?.total || 0,
                completed: completedBookings[0]?.total || 0
            },
            privateBookings: {
                total: totalPrivateBookings[0]?.total || 0,
                completed: completedPrivateBookings[0]?.total || 0
            },
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date()
            }
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).json({ error: 'Failed to fetch system statistics' });
    }
};

module.exports = {
    getAllUsers,
    getAllAgencies,
    getAllPrivateRides,
    updateUserStatus,
    deleteUser,
    getSystemStats
}; 