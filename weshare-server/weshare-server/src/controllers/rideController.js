const Ride = require('../models/ride');
const Agency = require('../models/agency');
const redisClient = require('../Utilities/redisClient');
const User = require('../models/user');
const DestinationCategory = require('../models/destinationCategory');


// Helper function to clear Redis cache
const clearCache = async () => {
    await redisClient.del('available_rides');
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
        const departureTime = new Date(departure_time);
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
        res.status(201).json({ message: 'Ride created successfully', ride });
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
            // Add a field for available seats
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
                },
            },
            // Filter for rides with available seats > 0
            {
                $match: {
                    available_seats: { $gt: 0 },
                },
            },
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
        res.status(500).json({ error: 'Failed to fetch rides', details: error.message });
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
        res.status(200).json(ride);
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
        res.status(200).json({ message: 'Ride updated successfully', ride: updatedRide });
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
                    available_seats: { $subtract: ["$seats", "$booked_seats"] }
                }
            },
            { $match: { available_seats: { $gt: 0 } } },
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

// POST /rides/:id/book - Book seats on a ride (Users)
const bookRide = async (req, res) => {
    try {
        const { rideId } = req.params;
        const userId = req.user.id; // From auth middleware

        // Find the ride
        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        // Check if seats are available
        if (ride.available_seats <= 0) {
            return res.status(400).json({ error: 'No seats available' });
        }

        // Check if user already booked this ride
        if (ride.booked_users.includes(userId)) {
            return res.status(400).json({ error: 'You have already booked this ride' });
        }

        // Update the ride
        ride.booked_users.push(userId);
        ride.available_seats -= 1;
        await ride.save();

        // Add to user's booked rides
        const user = await User.findById(userId);
        user.booked_rides.push(rideId);
        await user.save();

        res.status(200).json({ message: 'Ride booked successfully', ride });
    } catch (error) {
        res.status(500).json({ error: 'Failed to book ride', details: error.message });
    }
};

const getUserRides = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find user and populate booked rides with agency details
        const user = await User.findById(userId).populate({
            path: 'booked_rides',
            populate: {
                path: 'agencyId',
                select: 'name email'  // Only select necessary fields
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        

        res.status(200).json(user.booked_rides);
    } catch (error) {
        console.error('Error in getUserRides:', error);
        res.status(500).json({ 
            error: 'Failed to fetch user rides', 
            details: error.message 
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
        if (!ride.booked_users.includes(userId)) {
            return res.status(400).json({ error: 'You have not booked this ride' });
        }

        // Remove user from booked_users and increase available seats
        ride.booked_users = ride.booked_users.filter(id => id.toString() !== userId);
        ride.available_seats += 1;
        await ride.save();

        // Remove ride from user's booked_rides
        const user = await User.findById(userId);
        user.booked_rides = user.booked_rides.filter(id => id.toString() !== rideId);
        await user.save();

        res.status(200).json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel booking', details: error.message });
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
    cancelRideBooking
    
};
