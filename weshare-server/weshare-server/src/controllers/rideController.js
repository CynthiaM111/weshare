const Ride = require('../models/ride');
const Agency = require('../models/agency');
const redisClient = require('../Utilities/redisClient');


// Helper function to clear Redis cache
const clearCache = async () => {
    await redisClient.del('available_rides');
};

// POST /rides - Create a new ride (Agency)
const createRide = async (req, res) => {
    try {
        const { from, to, departure_time, seats, agencyId, price } = req.body;

        const ride = new Ride({
            from,
            to,
            departure_time: new Date(departure_time),
            seats,
            agencyId,
            price: price || 0,
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
                    seats: 1,
                    agencyId: 1,
                    price: 1,
                    status: 1,
                    booked_seats: 1,
                    created_at: 1,
                    updated_at: 1,
                    available_seats: { $subtract: ['$seats', '$booked_seats'] }, // Calculate available seats
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

        // Populate agency details (since aggregate doesn't do this automatically)
        await Ride.populate(rides, { path: 'agencyId', select: 'name email' });

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
            .populate('agencyId', 'name email');

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

        const ride = await Ride.findByIdAndUpdate(
            id,
            { ...updates, updated_at: Date.now() },
            { new: true, runValidators: true } // Return updated doc, validate inputs
        );

        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        await clearCache(); // Clear cache on update
        res.status(200).json({ message: 'Ride updated successfully', ride });
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

    // POST /rides/:id/book - Book seats on a ride (Users)
    // const bookRide = async (req, res) => {
    //     try {
    //         const { id } = req.params;
    //         const { seatsToBook } = req.body; // Number of seats to book

    //         if (!seatsToBook || seatsToBook <= 0) {
    //             return res.status(400).json({ error: 'Invalid number of seats to book' });
    //         }

    //         const ride = await Ride.findById(id);
    //         if (!ride || ride.status !== 'active') {
    //             return res.status(404).json({ error: 'Ride not found or not available' });
    //         }

    //         const availableSeats = ride.seats - ride.booked_seats;
    //         if (seatsToBook > availableSeats) {
    //             return res.status(400).json({ error: 'Not enough seats available' });
    //         }

    //         ride.booked_seats += seatsToBook;
    //         if (ride.booked_seats === ride.seats) {
    //             ride.status = 'completed'; // Mark as full if all seats are booked
    //         }

    //         await ride.save();
    //         await clearCache(); // Clear cache after booking
    //         res.status(200).json({ message: 'Seats booked successfully', ride });
    //     } catch (error) {
    //         res.status(500).json({ error: 'Failed to book ride', details: error.message });
    //     }
    ;

module.exports = {
    createRide,
    getRides,
    getRideById,
    updateRide,
    deleteRide,
    // bookRide,
};
