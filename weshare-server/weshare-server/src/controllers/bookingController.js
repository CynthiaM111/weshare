const Ride = require('../models/ride');
const User = require('../models/user');

// GET /bookings - Get all bookings for analytics (agency only)
const getBookings = async (req, res) => {
    try {
        const agencyId = req.user.id;

        // Find all rides created by this agency
        const rides = await Ride.find({
            agencyId: agencyId,
            'bookedBy.0': { $exists: true } // Only rides with bookings
        })
            .populate('bookedBy.userId', 'name email')
            .populate('categoryId', 'from to averageTime')
            .lean();

        // Transform rides into booking records
        const bookings = [];

        rides.forEach(ride => {
            ride.bookedBy.forEach(booking => {
                bookings.push({
                    _id: booking.bookingId || booking._id,
                    rideId: ride._id,
                    userId: booking.userId,
                    checkInStatus: booking.checkInStatus,
                    bookingId: booking.bookingId,
                    created_at: booking.createdAt || ride.created_at,
                    updated_at: booking.updatedAt || ride.updated_at,
                    ride: {
                        _id: ride._id,
                        from: ride.from,
                        to: ride.to,
                        departure_time: ride.departure_time,
                        estimatedArrivalTime: ride.estimatedArrivalTime,
                        price: ride.price,
                        seats: ride.seats,
                        booked_seats: ride.booked_seats,
                        licensePlate: ride.licensePlate,
                        isPrivate: ride.isPrivate,
                        status: ride.status,
                        categoryId: ride.categoryId
                    }
                });
            });
        });

        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            error: 'Failed to fetch bookings',
            details: error.message
        });
    }
};

// GET /bookings/stats - Get booking statistics for analytics
const getBookingStats = async (req, res) => {
    try {
        const agencyId = req.user.id;

        // Get all rides for this agency
        const rides = await Ride.find({
            agencyId: agencyId
        }).lean();

        // Calculate statistics
        const totalBookings = rides.reduce((sum, ride) => sum + ride.bookedBy.length, 0);
        const completedBookings = rides.reduce((sum, ride) => {
            return sum + ride.bookedBy.filter(booking => booking.checkInStatus === 'completed').length;
        }, 0);
        const totalRevenue = rides.reduce((sum, ride) => {
            return sum + (ride.bookedBy.length * (ride.price || 0));
        }, 0);

        // Monthly trends (last 12 months)
        const monthlyStats = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const monthBookings = rides.reduce((sum, ride) => {
                const rideBookings = ride.bookedBy.filter(booking => {
                    const bookingDate = new Date(booking.createdAt || ride.created_at);
                    return bookingDate >= monthStart && bookingDate <= monthEnd;
                });
                return sum + rideBookings.length;
            }, 0);

            monthlyStats.push({
                month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                bookings: monthBookings
            });
        }

        // Category performance
        const categoryStats = {};
        rides.forEach(ride => {
            if (ride.categoryId) {
                const categoryKey = ride.categoryId.toString();
                if (!categoryStats[categoryKey]) {
                    categoryStats[categoryKey] = {
                        bookings: 0,
                        revenue: 0
                    };
                }
                categoryStats[categoryKey].bookings += ride.bookedBy.length;
                categoryStats[categoryKey].revenue += ride.bookedBy.length * (ride.price || 0);
            }
        });

        res.status(200).json({
            totalBookings,
            completedBookings,
            completionRate: totalBookings > 0 ? (completedBookings / totalBookings * 100).toFixed(1) : 0,
            totalRevenue,
            monthlyStats,
            categoryStats
        });
    } catch (error) {
        console.error('Error fetching booking stats:', error);
        res.status(500).json({
            error: 'Failed to fetch booking statistics',
            details: error.message
        });
    }
};

module.exports = {
    getBookings,
    getBookingStats
}; 