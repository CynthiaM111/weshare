const Ride = require('../models/ride');
const Agency = require('../models/agency');
const redisClient = require('../Utilities/redisClient');
const User = require('../models/user');
const DestinationCategory = require('../models/destinationCategory');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Helper function to clear Redis cache
const clearCache = async () => {
    await redisClient.del('available_rides');
};
// Helper function to compute ride status
const getRideStatus = (ride) => {
    const bookedRatio = ride.booked_seats / ride.seats;
    if (ride.booked_seats >= ride.seats) {
        return 'Full';
    } else if (bookedRatio >= 0.75) {
        return 'Nearly Full';
    } else {
        return 'Available';
    }
};

// POST /rides - Create a new ride (Agency)
const createRide = async (req, res) => {
    try {
        const {
            categoryId,
            departure_time,
            seats,
            price,
            licensePlate
        } = req.body;

        // Validate departure_time is not in the past
        const departureTime = new Date(departure_time);
        const currentTime = new Date();
        if (departureTime < currentTime) {
            return res.status(400).json({ error: 'Cannot create a ride with a past departure time' });
        }

        // Verify category exists and belongs to agency
        const category = await DestinationCategory.findOne({
            _id: categoryId,
            agencyId: req.user.id,
            isActive: true
        });

        if (!category) {
            return res.status(404).json({ error: 'Destination category not found' });
        }

        // Calculate estimated arrival time
       
        const estimatedArrivalTime = new Date(departureTime);
        estimatedArrivalTime.setHours(estimatedArrivalTime.getHours() + category.averageTime);

        const ride = new Ride({
            categoryId,
            from: category.from,
            to: category.to,
            departure_time: departureTime,
            estimatedArrivalTime,
            seats,
            price: price || 0,
            licensePlate,
            agencyId: req.user.id,
            booked_seats: 0
        });

        await ride.save();
        await clearCache();
        const rideWithStatus = {
            ...ride.toObject(),
            statusDisplay: getRideStatus(ride)
        };
        res.status(201).json({ message: 'Ride created successfully', ride: rideWithStatus });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create ride', details: error.message });
    }
};

const getRides = async (req, res) => {
    try {
        // Check Redis cache first
        const cachedRides = await redisClient.get('available_rides');
        if (cachedRides) {
            return res.status(200).json(JSON.parse(cachedRides));
        }

        // Use aggregation to compare seats and booked_seats
        const rides = await Ride.aggregate([
            // Match active rides with future departure times
            {
                $match: {
                    status: 'active',
                    departure_time: { $gte: new Date() },
                },
            },
            // Add a field for available seats and status
            {
                $project: {
                    from: 1,
                    to: 1,
                    departure_time: 1,
                    estimatedArrivalTime: 1,
                    seats: 1,
                    agencyId: 1,
                    price: 1,
                    status: 1,
                    booked_seats: 1,
                    categoryId: 1,
                    licensePlate: 1,
                    created_at: 1,
                    updated_at: 1,
                    available_seats: { $subtract: ['$seats', '$booked_seats'] },
                    statusDisplay: {
                        $cond: {
                            if: { $gte: ['$booked_seats', '$seats'] },
                            then: 'Full',
                            else: {
                                $cond: {
                                    if: { $gte: [{ $divide: ['$booked_seats', '$seats'] }, 0.75] },
                                    then: 'Nearly Full',
                                    else: 'Available'
                                }
                            }
                        }
                    }
                },
            },
            // // Filter for rides with available seats > 0
            // {
            //     $match: {
            //         available_seats: { $gt: 0 },
            //     },
            // },
            // Sort by departure time
            {
                $sort: { departure_time: 1 },
            },
        ]);

        // Populate agency and category details
        await Ride.populate(rides, [
            { path: 'agencyId', select: 'name email' },
            { path: 'categoryId', select: 'from to averageTime' }
        ]);

        // Cache the result for 5 minutes
        await redisClient.setEx('available_rides', 300, JSON.stringify(rides));
        res.status(200).json(rides);
    } catch (error) {
        console.error('Error in getRides:', error);
        res.status(500).json({
            error: 'Failed to fetch rides',
            details: error.message
        });
    }
};

// GET /rides/:id - Fetch a single ride by ID
const getRideById = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id)
            .populate('agencyId', 'name email')
            .populate('categoryId', 'from to averageTime');

        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }
        const rideWithStatus = {
            ...ride.toObject(),
            statusDisplay: getRideStatus(ride)
        };
        res.status(200).json(rideWithStatus);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch ride', details: error.message });
    }
};

// PUT /rides/:id - Update a ride (Agency)
const updateRide = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent updating booked_seats directly via this endpoint
        if ('booked_seats' in updates) {
            delete updates.booked_seats;
        }

        // If updating departure time, recalculate ETA
        if (updates.departure_time) {
            const ride = await Ride.findById(id).populate('categoryId');
            if (ride && ride.categoryId) {
                const departureTime = new Date(updates.departure_time);
                const estimatedArrivalTime = new Date(departureTime);
                estimatedArrivalTime.setHours(estimatedArrivalTime.getHours() + ride.categoryId.averageTime);
                updates.estimatedArrivalTime = estimatedArrivalTime;
            }
        }

        const updatedRide = await Ride.findByIdAndUpdate(
            id,
            { ...updates, updated_at: Date.now() },
            { new: true, runValidators: true }
        ).populate(['agencyId', 'categoryId']);

        if (!updatedRide) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        await clearCache();
        const rideWithStatus = {
            ...updatedRide.toObject(),
            statusDisplay: getRideStatus(updatedRide)
        };
        res.status(200).json({ message: 'Ride updated successfully', ride: rideWithStatus });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update ride', details: error.message });
    }
};

// DELETE /rides/:id - Delete a ride (Agency)
const deleteRide = async (req, res) => {
    try {
        const { id } = req.params;
        const ride = await Ride.findByIdAndDelete(id);

        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        await clearCache(); // Clear cache on delete
        res.status(200).json({ message: 'Ride deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete ride', details: error.message });
    }
};

// GET /rides/search?from=&to=&departure_time=&date=
const searchRides = async (req, res) => {
    try {
        const { from, to, exact_match } = req.query;

        if (!from || !to) {
            return res.status(400).json({ error: 'At least origin or destination is required' });
        }

        // Base query conditions
        const query = {
            status: 'active',
            departure_time: { $gte: new Date() }
        };
        const exact = String(exact_match).toLowerCase() === 'true';
        query.from = exact ? from.trim() : new RegExp(from.trim(), 'i');
        query.to = exact ? to.trim() : new RegExp(to.trim(), 'i');

        const rides = await Ride.aggregate([
            { $match: query },
            {
                $addFields: {
                    available_seats: { $subtract: ["$seats", "$booked_seats"] },
                    statusDisplay: {
                        $cond: {
                            if: { $gte: ['$booked_seats', '$seats'] },
                            then: 'Full',
                            else: {
                                $cond: {
                                    if: { $gte: [{ $divide: ['$booked_seats', '$seats'] }, 0.75] },
                                    then: 'Nearly Full',
                                    else: 'Available'
                                }
                            }
                        }
                    }
                }
            },
            { $sort: { departure_time: 1 } },
            { $limit: 50 }
        ]);
        // Populate necessary references
        await Ride.populate(rides, [
            { path: 'agencyId', select: 'name email' },
            { path: 'categoryId', select: 'from to averageTime' }
        ]);

        res.status(200).json(rides.length ? rides : []);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            error: 'Search failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const bookRide = async (req, res) => {
    try {
        const { rideId } = req.params;
        const userId = req.user.id;
       

        if (!mongoose.Types.ObjectId.isValid(rideId) || !mongoose.Types.ObjectId.isValid(userId)) {
            console.error('Invalid rideId or userId:', { rideId, userId });
            return res.status(400).json({ error: 'Invalid rideId or userId' });
        }

        const ride = await Ride.findById(rideId);
        if (!ride) {
            console.error('Ride not found:', rideId);
            return res.status(404).json({ error: 'Ride not found' });
        }

        if (ride.booked_seats >= ride.seats) {
            console.error('No seats available:', rideId);
            return res.status(400).json({ error: 'No seats available' });
        }

        if (ride.bookedBy.some((b) => b.userId.toString() === userId)) {
            console.error('User already booked:', { userId, rideId });
            return res.status(400).json({ error: 'You have already booked this ride' });
        }

        const bookingId = uuidv4();
        ride.bookedBy.push({
            userId,
            checkInStatus: 'pending',
            bookingId,
        });
        ride.booked_seats = ride.bookedBy.length;
        await ride.save();

        const user = await User.findById(userId);
        user.booked_rides.push(rideId);
        await user.save();

        await redisClient.del(`bookedRides:${userId}`);
        res.status(200).json({
            message: 'Ride booked successfully',
            ride: {
                ...ride.toObject(),
                statusDisplay: getRideStatus(ride),
                bookingId,
            },
        });
    } catch (error) {
        console.error('Booking error:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to book ride', details: error.message });
    }
};
const getUserRides = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentDate = new Date();

        // Check Redis cache first
        const cacheKey = `bookedRides:${userId}`;
        const cachedRides = await redisClient.get(cacheKey);
        if (cachedRides) {
            return res.status(200).json(JSON.parse(cachedRides));
        }

        // Find rides where user is in bookedBy and departure_time is in the future
        const rides = await Ride.find({
            'bookedBy.userId': userId,
            departure_time: { $gte: currentDate },
            // status: { $in: ['active', 'pending', 'delayed'] }, // Exclude canceled/completed rides
        })
            .populate('agencyId', 'name email')
            .populate('categoryId', 'from to averageTime')
            .sort({ departure_time: 1 }); // Sort by departure time ascending

        if (!rides || rides.length === 0) {
            return res.status(200).json([]);
        }

        // Format rides with statusDisplay and necessary fields
        const ridesWithStatus = rides.map((ride) => {
            const booking = ride.bookedBy.find((b) => b.userId.toString() === userId);
            return {
                _id: ride._id,
                from: ride.from,
                to: ride.to,
                departure_time: ride.departure_time,
                estimatedArrivalTime: ride.estimatedArrivalTime,
                price: ride.price,
                seats: ride.seats,
                booked_seats: ride.booked_seats,
                bookedBy: ride.bookedBy,
                agencyId: ride.agencyId,
                categoryId: ride.categoryId,
                statusDisplay: getRideStatus(ride),
                checkInStatus: booking ? booking.checkInStatus : 'unknown',
            };
        });

        // Cache the result for 5 minutes
        await redisClient.setEx(cacheKey, 300, JSON.stringify(ridesWithStatus));

        res.status(200).json(ridesWithStatus);
    } catch (error) {
        console.error('Error in getUserRides:', error);
        res.status(500).json({
            error: 'Failed to fetch user rides',
            details: error.message,
        });
    }
};


const cancelRideBooking = async (req, res) => {
    try {
        const { rideId } = req.params;
        const userId = req.user.id;

        // Find and update the ride
        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        // Check if user has booked this ride
        const bookingIndex = ride.bookedBy.findIndex(b => b.userId.toString() === userId);
        if (bookingIndex === -1) {
            return res.status(400).json({ error: 'You have not booked this ride' });
        }

        // Remove user from bookedBy array
        ride.bookedBy.splice(bookingIndex, 1);
        ride.booked_seats = ride.bookedBy.length;
        await ride.save();

        // Remove ride from user's booked_rides
        const user = await User.findById(userId);
        user.booked_rides = user.booked_rides.filter(id => id.toString() !== rideId);
        await user.save();

        await redisClient.del(`bookedRides:${userId}`);
        await clearCache();
        res.status(200).json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error('Error in cancelRideBooking:', error);
        res.status(500).json({ error: 'Failed to cancel booking', details: error.message });
    }
};

// Updated: Fetch rides for an employee's destination category
const getEmployeeRides = async (req, res) => {
    try {
        if (!req.user) {
            console.error('No user in request');
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { destinationCategoryId } = req.user;

        // Validate destinationCategoryId
        if (!destinationCategoryId) {
            return res.status(400).json({ error: 'Invalid or missing destination category ID' });
        }

        const rides = await Ride.find({
            categoryId: destinationCategoryId,
            status: 'active',
            departure_time: { $gte: new Date() }
        })
            .populate('agencyId', 'name email')
            .populate('categoryId', 'from to averageTime')



        const ridesWithStatus = rides.map(ride => ({
            ...ride.toObject(),
            statusDisplay: getRideStatus(ride)
        }));

        res.status(200).json(ridesWithStatus);
    } catch (error) {
        console.error('Error in getEmployeeRides:', error);
        res.status(500).json({ error: 'Failed to fetch rides in getEmployeeRides', details: error.message });
    }
};


const checkInPassenger = async (req, res) => {
    try {
        const { rideId, userId, bookingId } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(rideId) || !mongoose.Types.ObjectId.isValid(userId)) {
            console.error('Invalid rideId or userId:', { rideId, userId });
            return res.status(400).json({ error: 'Invalid rideId or userId' });
        }

        const ride = await Ride.findById(rideId).populate('bookedBy.userId', 'name email');
        if (!ride) {
            console.error('Ride not found:', rideId);
            return res.status(404).json({ error: 'Ride not found' });
        }

        const booking = ride.bookedBy.find(
            (b) => b.userId?._id?.toString() === userId && b.bookingId === bookingId
        );

        if (!booking) {
            console.error('Booking not found:', { userId, bookingId, rideId });
            return res.status(400).json({ error: 'User not booked on this ride or invalid booking ID' });
        }

        if (booking.checkInStatus === 'checked-in') {
            console.error('User already checked in:', { userId, rideId });
            return res.status(400).json({ error: 'User already checked in' });
        }

        booking.checkInStatus = 'checked-in';
        await ride.save();

        await redisClient.del(`bookedRides:${userId}`);
        res.status(200).json({
            message: 'Passenger checked in',
            passenger: {
                name: booking.userId.name,
                email: booking.userId.email,
            },
        });
    } catch (error) {
        console.error('Error in checkInPassenger:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to check in', details: error.message });
    }
};

// GET /rides/history - Get user's ride history
const getRideHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get current date for comparison
        const currentDate = new Date();

        // Find past rides for the user
        const rides = await Ride.find({
            'bookedBy.userId': req.user.id,
            departure_time: { $lt: currentDate }
        })
            .select('from to departure_time price bookedBy status')
            .sort({ departure_time: -1 })
            .skip(skip)
            .limit(limit);

        // Transform the data to include only necessary information
        const history = rides.map(ride => {
            const booking = ride.bookedBy.find(b => b.userId.toString() === req.user.id.toString());
            return {
                from: ride.from,
                to: ride.to,
                departure_time: ride.departure_time,
                price: ride.price,  // Always use the ride's price
                status: booking ? booking.checkInStatus : 'unknown',

            };
        });

        // Get total count for pagination
        const total = await Ride.countDocuments({
            'bookedBy.userId': req.user.id,
            departure_time: { $lt: currentDate }
        });

        res.status(200).json({
            history,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error('Error in getRideHistory:', error);
        res.status(500).json({
            error: 'Failed to fetch ride history',
            details: error.message
        });
    }
};

module.exports = {
    createRide,
    getRides,
    getRideById,
    updateRide,
    deleteRide,
    searchRides,
    bookRide,
    getUserRides,
    cancelRideBooking,
    getEmployeeRides,
    checkInPassenger,
    getRideHistory
};
