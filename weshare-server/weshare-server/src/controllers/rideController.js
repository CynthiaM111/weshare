const Ride = require('../models/ride');
const Agency = require('../models/agency');
const redisClient = require('../Utilities/redisClient');
const User = require('../models/user');
const DestinationCategory = require('../models/destinationCategory');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const messagingService = require('../services/messagingService');
const ruleValidator = require('../Utilities/ruleValidator');

// Helper function to clear Redis cache
const clearCache = async () => {
    try {
        // Clear multiple cache keys to ensure consistency
        await Promise.all([
            redisClient.del('available_rides'),
            redisClient.del('bookedRides:*'), // Clear user-specific caches
        ]);
        console.log('Cache cleared successfully');
    } catch (error) {
        console.warn('Failed to clear cache:', error.message);
    }
};

// Helper function to warm up cache with fresh data
const warmCache = async () => {
    try {
        // Force a fresh fetch and cache it
        const rides = await Ride.aggregate([
            {
                $match: {
                    status: 'active',
                    departure_time: { $gte: new Date() },
                    publishStatus: 'published',
                },
            },
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
            {
                $sort: { departure_time: 1 },
            },
        ]);

        await Ride.populate(rides, [
            { path: 'agencyId', select: 'name email' },
            { path: 'categoryId', select: 'from to averageTime' }
        ]);

        if (Array.isArray(rides) && rides.length > 0) {
            await redisClient.setEx('available_rides', 300, JSON.stringify(rides));
            console.log(`Cache warmed with ${rides.length} rides`);
        }
    } catch (error) {
        console.warn('Failed to warm cache:', error.message);
    }
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

const createRide = async (req, res) => {
    try {
        const {
            isPrivate,
            from,
            to,
            date,
            time,
            description,
            estimatedArrivalTime, // hours (for private)
            licensePlate,
            categoryId,
            departure_time,       // ISO string (for public)
            seats,
            price
        } = req.body;

        const currentTime = new Date();
        const twoHoursFromNow = new Date(currentTime.getTime() + (2 * 60 * 60 * 1000));
        const thirtyDaysFromNow = new Date(currentTime.getTime() + (30 * 24 * 60 * 60 * 1000));

        let rideData = {
            licensePlate,
            description,
            isPrivate: !!isPrivate,
            booked_seats: 0,
            status: 'active',
            publishStatus: 'published', // Set as published for new rides
        };

        if (isPrivate) {
            // Validate required private ride fields with specific messages
            if (!from) {
                return res.status(400).json({ error: 'Please enter a pickup location (from)' });
            }
            if (!to) {
                return res.status(400).json({ error: 'Please enter a destination (to)' });
            }
            if (!date) {
                return res.status(400).json({ error: 'Please select a date for your ride' });
            }
            if (!time) {
                return res.status(400).json({ error: 'Please select a time for your ride' });
            }
            if (!description) {
                return res.status(400).json({ error: 'Please provide a description for your ride' });
            }
            if (!estimatedArrivalTime) {
                return res.status(400).json({ error: 'Please specify the estimated travel time in hours' });
            }
            if (!licensePlate) {
                return res.status(400).json({ error: 'Please enter your vehicle license plate number' });
            }
            if (!seats) {
                return res.status(400).json({ error: 'Please specify the number of available seats' });
            }
            if (!price) {
                return res.status(400).json({ error: 'Please enter the price per seat' });
            }

            // Validate license plate format
            const plateRegex = /^[A-Z0-9]{2,7}$/;
            if (!plateRegex.test(licensePlate.trim().toUpperCase())) {
                return res.status(400).json({ error: 'Please enter a valid license plate number (2-7 characters, letters and numbers only)' });
            }

            // Validate seat count
            const seatCount = parseInt(seats);
            if (isNaN(seatCount) || seatCount < 1 || seatCount > 8) {
                return res.status(400).json({ error: 'Please enter a valid number of seats (1-8 passengers)' });
            }

            // Validate price
            const ridePrice = parseFloat(price);
            if (isNaN(ridePrice) || ridePrice < 1 || ridePrice > 100) {
                return res.status(400).json({ error: 'Please enter a valid price (minimum $1, maximum $100)' });
            }

            const departureTime = new Date(`${date}T${time}`);

            // Enhanced date/time validation
            if (isNaN(departureTime.getTime())) {
                return res.status(400).json({ error: 'Please select a valid date and time' });
            }

            if (departureTime < currentTime) {
                return res.status(400).json({ error: 'You cannot create a ride for a date and time in the past' });
            }

            if (departureTime < twoHoursFromNow) {
                return res.status(400).json({ error: 'Rides must be scheduled at least 2 hours in advance' });
            }

            if (departureTime > thirtyDaysFromNow) {
                return res.status(400).json({ error: 'You cannot create a ride more than 30 days in advance' });
            }

            // Check if it's a weekend (Saturday = 6, Sunday = 0)
            const dayOfWeek = departureTime.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                return res.status(400).json({ error: 'Rides cannot be scheduled on weekends' });
            }

            // Check time range (6 AM to 10 PM)
            const hours = departureTime.getHours();
            if (hours < 6 || hours > 22) {
                return res.status(400).json({ error: 'Rides are only available from 6:00 AM to 10:00 PM' });
            }

            rideData = {
                ...rideData,
                from,
                to,
                departure_time: departureTime,
                estimatedArrivalTime: new Date(departureTime.getTime() + (parseInt(estimatedArrivalTime) * 60 * 60 * 1000)),
                seats: seatCount,
                price: ridePrice,
                userId: req.user.id,
                categoryId: null,
                agencyId: null
            };
        } else {
            // Validate required public ride fields with specific messages
            if (!categoryId) {
                return res.status(400).json({ error: 'Please select a destination category' });
            }
            if (!departure_time) {
                return res.status(400).json({ error: 'Please select a departure time' });
            }
            if (!seats) {
                return res.status(400).json({ error: 'Please specify the number of available seats' });
            }
            if (!licensePlate) {
                return res.status(400).json({ error: 'Please enter your vehicle license plate number' });
            }

            // Validate license plate format
            const plateRegex = /^[A-Z0-9]{2,7}$/;
            if (!plateRegex.test(licensePlate.trim().toUpperCase())) {
                return res.status(400).json({ error: 'Please enter a valid license plate number (2-7 characters, letters and numbers only)' });
            }

            // Validate seat count
            const seatCount = parseInt(seats);
            if (isNaN(seatCount) || seatCount < 1 || seatCount > 50) {
                return res.status(400).json({ error: 'Please enter a valid number of seats (1-50 passengers)' });
            }

            const departureTime = new Date(departure_time);

            // Enhanced date/time validation
            if (isNaN(departureTime.getTime())) {
                return res.status(400).json({ error: 'Please select a valid departure time' });
            }

            if (departureTime < currentTime) {
                return res.status(400).json({ error: 'You cannot create a ride for a date and time in the past' });
            }

            if (departureTime < twoHoursFromNow) {
                return res.status(400).json({ error: 'Rides must be scheduled at least 2 hours in advance' });
            }

            if (departureTime > thirtyDaysFromNow) {
                return res.status(400).json({ error: 'You cannot create a ride more than 30 days in advance' });
            }

            // Check time range (6 AM to 10 PM)
            const hours = departureTime.getHours();
            if (hours < 6 || hours > 22) {
                return res.status(400).json({ error: 'Rides are only available from 6:00 AM to 10:00 PM' });
            }

            const category = await DestinationCategory.findOne({
                _id: categoryId,
                agencyId: req.user.id,
                isActive: true
            });

            if (!category) {
                return res.status(404).json({ error: 'Destination category not found or is no longer active' });
            }

            const arrivalTime = new Date(departureTime);
            arrivalTime.setHours(arrivalTime.getHours() + category.averageTime);

            rideData = {
                ...rideData,
                categoryId,
                agencyId: req.user.id,
                from: category.from,
                to: category.to,
                departure_time: departureTime,
                estimatedArrivalTime: arrivalTime,
                seats: seatCount,
                price: price || 0
            };
        }

        const ride = new Ride(rideData);
        await ride.save();
        await clearCache();

        const rideWithStatus = {
            ...ride.toObject(),
            statusDisplay: getRideStatus(ride)
        };

        res.status(201).json({
            message: isPrivate ? 'Private ride created successfully' : 'Ride created successfully',
            ride: rideWithStatus
        });
    } catch (error) {
        console.error('Error in createRide:', error);

        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                error: validationErrors.join('. ')
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                error: 'A ride with these details already exists'
            });
        }

        res.status(500).json({
            error: 'Failed to create ride. Please try again later.',
            details: error.message
        });
    }
};

const createDraft = async (req, res) => {
    try {
        const {
            isPrivate,
            from,
            to,
            date,
            time,
            description,
            estimatedArrivalTime,
            licensePlate,
            categoryId,
            departure_time,
            seats,
            price
        } = req.body;

        let rideData = {
            licensePlate,
            description,
            isPrivate: !!isPrivate,
            booked_seats: 0,
            status: 'pending',
            publishStatus: 'draft', // Set as draft
        };

        if (isPrivate) {
            // For drafts, we can be more lenient with validation
            if (!from || !to || !description || !licensePlate || !seats || !price) {
                return res.status(400).json({ error: 'Please fill in all required fields for the draft' });
            }

            // Basic validation for license plate
            const plateRegex = /^[A-Z0-9]{2,7}$/;
            if (!plateRegex.test(licensePlate.trim().toUpperCase())) {
                return res.status(400).json({ error: 'Please enter a valid license plate number (2-7 characters, letters and numbers only)' });
            }

            // Basic validation for seats
            const seatCount = parseInt(seats);
            if (isNaN(seatCount) || seatCount < 1 || seatCount > 8) {
                return res.status(400).json({ error: 'Please enter a valid number of seats (1-8 passengers)' });
            }

            // Basic validation for price
            const ridePrice = parseFloat(price);
            if (isNaN(ridePrice) || ridePrice < 1 || ridePrice > 100) {
                return res.status(400).json({ error: 'Please enter a valid price (minimum $1, maximum $100)' });
            }

            // For drafts, we can allow future dates without strict validation
            const departureTime = date && time ? new Date(`${date}T${time}`) : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to tomorrow

            rideData = {
                ...rideData,
                from,
                to,
                departure_time: departureTime,
                estimatedArrivalTime: estimatedArrivalTime ?
                    new Date(departureTime.getTime() + (parseInt(estimatedArrivalTime) * 60 * 60 * 1000)) :
                    new Date(departureTime.getTime() + (2 * 60 * 60 * 1000)), // Default 2 hours
                seats: seatCount,
                price: ridePrice,
                userId: req.user.id,
                categoryId: null,
                agencyId: null
            };
        } else {
            // For public ride drafts
            if (!categoryId || !licensePlate || !seats) {
                return res.status(400).json({ error: 'Please fill in all required fields for the draft' });
            }

            // Basic validation for license plate
            const plateRegex = /^[A-Z0-9]{2,7}$/;
            if (!plateRegex.test(licensePlate.trim().toUpperCase())) {
                return res.status(400).json({ error: 'Please enter a valid license plate number (2-7 characters, letters and numbers only)' });
            }

            // Basic validation for seats
            const seatCount = parseInt(seats);
            if (isNaN(seatCount) || seatCount < 1 || seatCount > 50) {
                return res.status(400).json({ error: 'Please enter a valid number of seats (1-50 passengers)' });
            }

            const category = await DestinationCategory.findOne({
                _id: categoryId,
                agencyId: req.user.id
            });

            if (!category) {
                return res.status(400).json({ error: 'Invalid destination category' });
            }

            // For drafts, we can allow future dates without strict validation
            const departureTime = departure_time ? new Date(departure_time) : new Date(Date.now() + 24 * 60 * 60 * 1000);

            rideData = {
                ...rideData,
                from: category.from,
                to: category.to,
                departure_time: departureTime,
                estimatedArrivalTime: new Date(departureTime.getTime() + (category.averageTime * 60 * 60 * 1000)),
                seats: seatCount,
                price: price || category.averagePrice || 0,
                categoryId: category._id,
                agencyId: req.user.id,
                userId: null
            };
        }

        const ride = new Ride(rideData);
        await ride.save();

        await clearCache();

        res.status(201).json({
            message: 'Draft ride created successfully',
            ride: {
                id: ride._id,
                from: ride.from,
                to: ride.to,
                departure_time: ride.departure_time,
                seats: ride.seats,
                price: ride.price,
                publishStatus: ride.publishStatus,
                status: ride.status
            }
        });

    } catch (error) {
        console.error('Error creating draft ride:', error);
        res.status(500).json({ error: 'Failed to create draft ride' });
    }
};

const getRides = async (req, res) => {
    try {
        // Check Redis cache first
        let cachedRides = null;
        try {
            cachedRides = await redisClient.get('available_rides');
        } catch (cacheError) {
            console.warn('Redis cache error, proceeding without cache:', cacheError.message);
        }

        if (cachedRides) {
            try {
                const parsedRides = JSON.parse(cachedRides);
                // Validate that cached data is an array and has content
                if (Array.isArray(parsedRides) && parsedRides.length > 0) {
                    return res.status(200).json(parsedRides);
                } else {
                    console.log('Cached data is empty or invalid, fetching fresh data');
                }
            } catch (parseError) {
                console.warn('Failed to parse cached rides, fetching fresh data:', parseError.message);
            }
        }

        // Use aggregation to compare seats and booked_seats
        const rides = await Ride.aggregate([
            // Match active rides with future departure times
            {
                $match: {
                    status: 'active',
                    departure_time: { $gte: new Date() },
                    publishStatus: 'published', // Only show published rides
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

        // Only cache if we have valid data
        if (Array.isArray(rides) && rides.length > 0) {
            try {
                // Cache the result for 5 minutes
                await redisClient.setEx('available_rides', 300, JSON.stringify(rides));
            } catch (cacheError) {
                console.warn('Failed to cache rides:', cacheError.message);
            }
        }

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

        // Send ride update messages to all passengers
        try {
            await messagingService.sendRideUpdateToPassengers(id, updates);
        } catch (messageError) {
            console.error('Failed to send ride update messages:', messageError);
            // Don't fail the update if message sending fails
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

        // First, find the ride to validate against rules
        const ride = await Ride.findById(id);
        if (!ride) {
            return res.status(404).json({
                error: 'Ride not found',
                code: 'RIDE_NOT_FOUND',
                timestamp: new Date().toISOString()
            });
        }

        // Validate deletion against business rules
        const context = ruleValidator.createRideContext(ride, req.user);
        const validationResult = ruleValidator.validateAction('ride', 'delete', context);

        if (!validationResult.isValid) {
            return res.status(400).json({
                error: validationResult.message,
                code: validationResult.errorCode,
                action: 'ride.delete',
                timestamp: new Date().toISOString(),
                details: {
                    rideId: id,
                    rideStatus: ride.status,
                    bookingsCount: ride.bookedBy ? ride.bookedBy.length : 0,
                    departureTime: ride.departure_time
                }
            });
        }

        // If validation passes, proceed with deletion
        await Ride.findByIdAndDelete(id);

        // Send ride cancellation messages to all passengers
        try {
            await messagingService.sendRideCancellationToPassengers(id);
        } catch (messageError) {
            console.error('Failed to send ride cancellation messages:', messageError);
            // Don't fail the deletion if message sending fails
        }

        await clearCache(); // Clear cache on delete
        res.status(200).json({ message: 'Ride deleted successfully' });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to delete ride',
            code: 'DELETE_FAILED',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// GET /rides/search?from=&to=&departure_time=&date=
const searchRides = async (req, res) => {
    try {
        const { from, to, exact_match, isPrivate } = req.query;

        if (!from || !to) {
            return res.status(400).json({ error: 'At least origin or destination is required' });
        }

        // Base query conditions
        const query = {
            status: 'active',
            departure_time: { $gte: new Date() },
            publishStatus: 'published', // Only show published rides
        };

        // Add isPrivate filter - default to false (public rides) if not specified
        const privateFilter = isPrivate === 'true';
        query.isPrivate = privateFilter;

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
            return res.status(400).json({
                error: 'Invalid rideId or userId',
                code: 'INVALID_INPUT'
            });
        }

        const ride = await Ride.findById(rideId);
        if (!ride) {
            console.error('Ride not found:', rideId);
            return res.status(404).json({
                error: 'Ride not found',
                code: 'RIDE_NOT_FOUND'
            });
        }

        // Get user's existing bookings for validation
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Get user's existing bookings
        const userBookings = await Ride.find({
            'bookedBy.userId': userId,
            departure_time: { $gte: new Date() }
        }).select('departure_time');

        // Validate booking creation against business rules
        const context = ruleValidator.createBookingCreationContext(ride, req.user, userBookings);
        const validationResult = ruleValidator.validateAction('booking', 'create', context);

        if (!validationResult.isValid) {
            return res.status(400).json({
                error: validationResult.message,
                code: validationResult.errorCode,
                action: 'booking.create',
                timestamp: new Date().toISOString(),
                details: {
                    rideId: rideId,
                    userId: userId,
                    rideStatus: ride.status,
                    availableSeats: ride.seats - (ride.booked_seats || 0),
                    departureTime: ride.departure_time,
                    userBookingCount: userBookings.length
                }
            });
        }

        // Prevent drivers from booking their own private rides
        if (ride.isPrivate && ride.userId && ride.userId.toString() === userId) {
            console.error('Driver cannot book their own ride:', { userId, rideId });
            return res.status(400).json({
                error: 'You cannot book your own ride',
                code: 'CANNOT_BOOK_OWN_RIDE'
            });
        }

        const bookingId = uuidv4();
        ride.bookedBy.push({
            userId,
            checkInStatus: 'pending',
            bookingId,
        });
        ride.booked_seats = ride.bookedBy.length;
        await ride.save();

        user.booked_rides.push(rideId);
        await user.save();

        // Send booking confirmation message
        try {
            await messagingService.sendBookingConfirmation(userId, rideId);
        } catch (messageError) {
            console.error('Failed to send booking confirmation message:', messageError);
            // Don't fail the booking if message sending fails
        }

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
        res.status(500).json({
            error: 'Failed to book ride',
            code: 'BOOKING_FAILED',
            details: error.message
        });
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
        // Also exclude rides where the user's booking is completed
        const rides = await Ride.find({
            'bookedBy.userId': userId,
            departure_time: { $gte: currentDate },
        })
            .populate('agencyId', 'name email')
            .populate('categoryId', 'from to averageTime')
            .sort({ departure_time: 1 }); // Sort by departure time ascending

        if (!rides || rides.length === 0) {
            return res.status(200).json([]);
        }

        // Format rides with statusDisplay and necessary fields, excluding completed bookings
        const ridesWithStatus = rides
            .map((ride) => {
                const booking = ride.bookedBy.find((b) => b.userId.toString() === userId);

                // Skip rides where user's booking is completed
                if (booking && booking.checkInStatus === 'completed') {
                    return null;
                }

                // For public rides, check if departure time has passed and status is still pending
                let effectiveCheckInStatus = booking ? booking.checkInStatus : 'unknown';
                if (!ride.isPrivate && booking && booking.checkInStatus === 'pending' && ride.departure_time < currentDate) {
                    effectiveCheckInStatus = 'missed';
                }

                // For private rides, check if ETA + 2 hours has passed and status is not completed
                if (ride.isPrivate && booking && booking.checkInStatus !== 'completed') {
                    const etaPlus2Hours = new Date(ride.estimatedArrivalTime.getTime() + (2 * 60 * 60 * 1000)); // ETA + 2 hours
                    if (currentDate > etaPlus2Hours) {
                        effectiveCheckInStatus = 'no completion';
                    }
                }

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
                    licensePlate: ride.licensePlate,
                    isPrivate: ride.isPrivate,
                    statusDisplay: getRideStatus(ride),
                    checkInStatus: effectiveCheckInStatus,
                };
            })
            .filter(ride => ride !== null); // Remove null entries

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
            return res.status(404).json({
                error: 'Ride not found',
                code: 'RIDE_NOT_FOUND'
            });
        }

        // Check if user has booked this ride
        const booking = ride.bookedBy.find(b => b.userId.toString() === userId);
        if (!booking) {
            return res.status(400).json({
                error: 'You have not booked this ride',
                code: 'BOOKING_NOT_FOUND'
            });
        }

        // Validate booking cancellation against business rules
        const context = ruleValidator.createBookingContext(booking, ride, req.user);
        const validationResult = ruleValidator.validateAction('booking', 'cancel', context);

        if (!validationResult.isValid) {
            return res.status(400).json({
                error: validationResult.message,
                code: validationResult.errorCode,
                action: 'booking.cancel',
                timestamp: new Date().toISOString(),
                details: {
                    rideId: rideId,
                    userId: userId,
                    bookingStatus: booking.checkInStatus,
                    rideStatus: ride.status,
                    departureTime: ride.departure_time
                }
            });
        }

        // Remove user from bookedBy array
        const bookingIndex = ride.bookedBy.findIndex(b => b.userId.toString() === userId);
        ride.bookedBy.splice(bookingIndex, 1);
        ride.booked_seats = ride.bookedBy.length;
        await ride.save();

        // Remove ride from user's booked_rides
        const user = await User.findById(userId);
        user.booked_rides = user.booked_rides.filter(id => id.toString() !== rideId);
        await user.save();

        // Send booking cancellation message
        try {
            await messagingService.sendBookingCancellation(userId, rideId);
        } catch (messageError) {
            console.error('Failed to send booking cancellation message:', messageError);
            // Don't fail the cancellation if message sending fails
        }

        await redisClient.del(`bookedRides:${userId}`);
        await clearCache();
        res.status(200).json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error('Error in cancelRideBooking:', error);
        res.status(500).json({
            error: 'Failed to cancel booking',
            code: 'CANCELLATION_FAILED',
            details: error.message
        });
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

        // Find rides for the user that are either:
        // 1. Past rides (departure_time < currentDate)
        // 2. Rides where user's booking is completed
        const rides = await Ride.find({
            'bookedBy.userId': req.user.id,
            $or: [
                { departure_time: { $lt: currentDate } },
                { 'bookedBy': { $elemMatch: { userId: req.user.id, checkInStatus: 'completed' } } }
            ]
        })
            .populate('agencyId', 'name email')
            .populate('categoryId', 'from to averageTime')
            .select('from to departure_time estimatedArrivalTime price bookedBy status isPrivate licensePlate agencyId categoryId')
            .sort({ departure_time: -1 })
            .skip(skip)
            .limit(limit);

        // Transform the data to include only necessary information
        const history = rides.map(ride => {
            const booking = ride.bookedBy.find(b => b.userId.toString() === req.user.id.toString());
            let effectiveStatus = booking ? booking.checkInStatus : 'unknown';

            // For public rides, check if departure time has passed and status is still pending -> mark as missed
            if (!ride.isPrivate && booking && booking.checkInStatus === 'pending' && ride.departure_time < currentDate) {
                effectiveStatus = 'missed';
            }

            // For private rides, check if ETA + 2 hours has passed and status is not completed -> mark as no completion
            if (ride.isPrivate && booking && booking.checkInStatus !== 'completed') {
                const etaPlus2Hours = new Date(ride.estimatedArrivalTime.getTime() + (2 * 60 * 60 * 1000)); // ETA + 2 hours
                if (currentDate > etaPlus2Hours) {
                    effectiveStatus = 'no completion';
                }
            }

            return {
                _id: ride._id,
                from: ride.from,
                to: ride.to,
                departure_time: ride.departure_time,
                estimatedArrivalTime: ride.estimatedArrivalTime,
                price: ride.price,
                isPrivate: ride.isPrivate,
                licensePlate: ride.licensePlate,
                agencyId: ride.agencyId,
                categoryId: ride.categoryId,
                status: effectiveStatus,
                rideStatus: ride.status, // Overall ride status
            };
        });

        // Get total count for pagination
        const total = await Ride.countDocuments({
            'bookedBy.userId': req.user.id,
            $or: [
                { departure_time: { $lt: currentDate } },
                { 'bookedBy': { $elemMatch: { userId: req.user.id, checkInStatus: 'completed' } } }
            ]
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

// GET /rides/agency/history - Get agency's ride history
const getAgencyRideHistory = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const agencyId = req.user.id;

        // Calculate the date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Find all rides created by this agency within the specified time period
        const rides = await Ride.find({
            agencyId: agencyId,
            departure_time: { $gte: startDate, $lte: endDate }
        })
            .populate('categoryId', 'from to averageTime')
            .select('from to departure_time estimatedArrivalTime price bookedBy status isPrivate licensePlate categoryId seats booked_seats')
            .sort({ departure_time: -1 })
            .lean();

        // Transform the data to include necessary information for agency dashboard
        const history = rides.map(ride => {
            const now = new Date();
            const departureDate = new Date(ride.departure_time);
            const availableSeats = ride.seats - (ride.booked_seats || 0);
            const occupancyRate = (ride.booked_seats || 0) / ride.seats;

            // Determine ride status
            let status = 'active';
            if (departureDate < now) {
                status = 'completed';
            } else if (availableSeats === 0) {
                status = 'full';
            } else if (occupancyRate >= 0.8) {
                status = 'nearly-full';
            }

            return {
                _id: ride._id,
                from: ride.from,
                to: ride.to,
                departure_time: ride.departure_time,
                estimatedArrivalTime: ride.estimatedArrivalTime,
                price: ride.price,
                isPrivate: ride.isPrivate,
                licensePlate: ride.licensePlate,
                categoryId: ride.categoryId,
                status: status,
                seats: ride.seats,
                booked_seats: ride.booked_seats || 0,
                available_seats: availableSeats,
                occupancy_rate: occupancyRate,
                total_bookings: ride.bookedBy ? ride.bookedBy.length : 0
            };
        });

        res.status(200).json(history);
    } catch (error) {
        console.error('Error in getAgencyRideHistory:', error);
        res.status(500).json({
            error: 'Failed to fetch agency ride history',
            details: error.message
        });
    }
};

const getUserPrivateRides = async (req, res) => {
    try {
        // Get current date for comparison
        const currentDate = new Date();

        // Find active private rides (excluding completed ones)
        const rides = await Ride.find({
            userId: req.user.id,
            isPrivate: true,
            $and: [
                {
                    $or: [
                        { departure_time: { $gte: currentDate } }, // Future rides
                        { status: { $ne: 'completed' } } // Non-completed past rides
                    ]
                },
                { status: { $ne: 'completed' } } // Exclude explicitly completed rides
            ]
        })
            .populate('bookedBy.userId', 'name email')
            .sort({ departure_time: -1 })
            .lean();

        // Add computed fields for ride completion status
        const ridesWithStatus = rides.map(ride => {
            const allPassengersCompleted = ride.bookedBy.length > 0 &&
                ride.bookedBy.every(booking => booking.checkInStatus === 'completed');

            const somePassengersCompleted = ride.bookedBy.some(booking => booking.checkInStatus === 'completed');

            let computedStatus = ride.status;
            if (allPassengersCompleted && ride.status !== 'completed') {
                computedStatus = 'completed'; // Should be marked as completed if all passengers are done
            }

            // Check if ETA + 2 hours has passed and ride is not completed -> mark as no completion
            let effectiveStatus = computedStatus;
            if (ride.status !== 'completed' && !allPassengersCompleted) {
                const etaPlus2Hours = new Date(ride.estimatedArrivalTime.getTime() + (2 * 60 * 60 * 1000)); // ETA + 2 hours
                if (currentDate > etaPlus2Hours) {
                    effectiveStatus = 'no completion';
                }
            }

            return {
                ...ride,
                allPassengersCompleted,
                somePassengersCompleted,
                computedStatus: effectiveStatus,
                pendingPassengers: ride.bookedBy.filter(booking => booking.checkInStatus !== 'completed').length,
                completedPassengers: ride.bookedBy.filter(booking => booking.checkInStatus === 'completed').length
            };
        });

        res.status(200).json({ rides: ridesWithStatus });
    } catch (error) {
        console.error('Error fetching private rides:', error);
        res.status(500).json({ error: 'Failed to fetch private rides' });
    }
};

const getAvailablePrivateRides = async (req, res) => {
    try {
        const { from, to } = req.query;
        const userId = req.user.id;

        // Build search criteria
        const searchCriteria = {
            isPrivate: true,
            status: 'active',
            departure_time: { $gte: new Date() },
            userId: { $ne: userId }, // Exclude user's own rides
        };

        if (from) {
            searchCriteria.from = { $regex: from, $options: 'i' };
        }

        if (to) {
            searchCriteria.to = { $regex: to, $options: 'i' };
        }

        const rides = await Ride.find(searchCriteria)
            .populate('userId', 'name email')
            .select('from to departure_time estimatedArrivalTime licensePlate status description created_at seats price booked_seats userId')
            .sort({ departure_time: 1 })
            .lean();

        // Add driver info and available seats
        const ridesWithDriver = rides.map(ride => ({
            ...ride,
            driver: ride.userId,
            available_seats: ride.seats - (ride.booked_seats || 0)
        }));

        res.status(200).json({ rides: ridesWithDriver });
    } catch (error) {
        console.error('Error fetching available private rides:', error);
        res.status(500).json({ error: 'Failed to fetch available private rides' });
    }
};

// Generate completion PIN for private ride
const generateCompletionPin = async (req, res) => {
    try {
        const { rideId } = req.params;
        const { pin } = req.body;
        const userId = req.user.id;

        console.log('generateCompletionPin called with:', { rideId, pin, userId });

        if (!mongoose.Types.ObjectId.isValid(rideId) || !mongoose.Types.ObjectId.isValid(userId)) {
            console.log('Invalid IDs:', { rideId, userId });
            return res.status(400).json({ error: 'Invalid rideId or userId' });
        }

        if (!pin || pin.length !== 6) {
            console.log('Invalid PIN length:', pin);
            return res.status(400).json({ error: 'PIN must be exactly 6 digits' });
        }

        const ride = await Ride.findById(rideId);
        if (!ride) {
            console.log('Ride not found:', rideId);
            return res.status(404).json({ error: 'Ride not found' });
        }

        console.log('Found ride for PIN generation:', {
            id: ride._id,
            bookedBy: ride.bookedBy.map(b => ({
                userId: b.userId.toString(),
                checkInStatus: b.checkInStatus
            }))
        });

        // Check if user is booked on this ride
        const booking = ride.bookedBy.find(b => b.userId.toString() === userId);
        if (!booking) {
            console.log('User not booked on ride. Looking for userId:', userId);
            console.log('Available bookings:', ride.bookedBy.map(b => b.userId.toString()));
            return res.status(400).json({ error: 'User is not booked on this ride' });
        }

        if (booking.checkInStatus === 'completed') {
            console.log('Ride already completed for user:', userId);
            return res.status(400).json({ error: 'Ride already completed' });
        }

        // Store PIN temporarily (you might want to use Redis with expiration)
        booking.completionPin = pin;
        booking.pinGeneratedAt = new Date();

        console.log('Storing PIN for booking:', {
            userId: booking.userId.toString(),
            pin: pin,
            pinGeneratedAt: booking.pinGeneratedAt
        });

        await ride.save();

        console.log('PIN saved successfully for user:', userId);

        res.status(200).json({
            message: 'Completion PIN generated successfully',
            pin: pin
        });
    } catch (error) {
        console.error('Error generating completion PIN:', error);
        res.status(500).json({ error: 'Failed to generate completion PIN' });
    }
};

// Complete ride with PIN (driver enters this)
const completeRideWithPin = async (req, res) => {
    try {
        const { rideId } = req.params;
        const { pin, passengerUserId } = req.body;
        const driverId = req.user.id;

        console.log('completeRideWithPin called with:', { rideId, pin, passengerUserId, driverId });

        if (!mongoose.Types.ObjectId.isValid(rideId)) {
            console.log('Invalid rideId:', rideId);
            return res.status(400).json({ error: 'Invalid rideId' });
        }

        if (!mongoose.Types.ObjectId.isValid(passengerUserId)) {
            console.log('Invalid passengerUserId:', passengerUserId);
            return res.status(400).json({ error: 'Invalid passengerUserId' });
        }

        if (!pin || pin.length !== 6) {
            console.log('Invalid PIN:', pin);
            return res.status(400).json({ error: 'PIN must be exactly 6 digits' });
        }

        const ride = await Ride.findById(rideId).populate('bookedBy.userId', 'name email');
        if (!ride) {
            console.log('Ride not found:', rideId);
            return res.status(404).json({ error: 'Ride not found' });
        }

        console.log('Found ride:', {
            id: ride._id,
            isPrivate: ride.isPrivate,
            driverId: ride.userId,
            bookedBy: ride.bookedBy.map(b => ({
                userId: b.userId._id,
                checkInStatus: b.checkInStatus,
                hasPin: !!b.completionPin
            }))
        });

        // Check if the current user is the driver of this private ride
        if (ride.isPrivate && ride.userId.toString() !== driverId) {
            console.log('Not the driver. Ride userId:', ride.userId.toString(), 'Current user:', driverId);
            return res.status(403).json({ error: 'Only the ride driver can complete the ride' });
        }

        // Find the passenger booking
        const booking = ride.bookedBy.find(b => b.userId._id.toString() === passengerUserId);
        if (!booking) {
            console.log('Passenger booking not found. Looking for userId:', passengerUserId);
            console.log('Available bookings:', ride.bookedBy.map(b => ({
                userId: b.userId._id.toString(),
                checkInStatus: b.checkInStatus
            })));
            return res.status(400).json({ error: 'Passenger not found on this ride' });
        }

        if (!booking.completionPin) {
            console.log('No completion PIN for passenger:', passengerUserId);
            return res.status(400).json({ error: 'No completion PIN generated for this passenger' });
        }

        if (booking.completionPin !== pin) {
            console.log('PIN mismatch. Expected:', booking.completionPin, 'Received:', pin);
            return res.status(400).json({ error: 'Invalid PIN' });
        }

        // Check PIN expiration (15 minutes)
        const pinAge = (new Date() - booking.pinGeneratedAt) / (1000 * 60);
        if (pinAge > 15) {
            console.log('PIN expired. Age in minutes:', pinAge);
            return res.status(400).json({ error: 'PIN has expired. Please generate a new one.' });
        }

        // Mark ride as completed for this passenger
        booking.checkInStatus = 'completed';
        booking.completedAt = new Date();
        booking.completionPin = undefined; // Clear the PIN
        booking.pinGeneratedAt = undefined;

        // Check if all passengers have completed the ride
        const allCompleted = ride.bookedBy.every(b => b.checkInStatus === 'completed');
        if (allCompleted) {
            ride.status = 'completed';
            console.log('Marking ride as completed:', ride._id);
        }

        await ride.save();
        console.log('Ride saved with status:', ride.status, 'All completed:', allCompleted);

        // Clear cache
        await redisClient.del(`bookedRides:${passengerUserId}`);
        if (ride.isPrivate) {
            await redisClient.del(`privateRides:${driverId}`);
        }

        // Clear additional caches to ensure UI updates
        await clearCache(); // Clear general rides cache

        // Clear cache for all passengers on this ride
        for (const booking of ride.bookedBy) {
            await redisClient.del(`bookedRides:${booking.userId._id || booking.userId}`);
        }

        // Send ride completion message to the passenger
        try {
            await messagingService.sendRideCompletion(passengerUserId, rideId);
        } catch (messageError) {
            console.error('Failed to send ride completion message:', messageError);
            // Don't fail the completion if message sending fails
        }

        console.log('Ride completed successfully for passenger:', passengerUserId);

        res.status(200).json({
            message: 'Ride completed successfully',
            passenger: {
                name: booking.userId.name,
                email: booking.userId.email,
            },
            rideCompleted: allCompleted
        });
    } catch (error) {
        console.error('Error completing ride with PIN:', error);
        res.status(500).json({ error: 'Failed to complete ride' });
    }
};

const getUserPrivateRideHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get current date for comparison
        const currentDate = new Date();

        // Find completed private rides for the driver
        const rides = await Ride.find({
            userId: req.user.id,
            isPrivate: true,
            $or: [
                { status: 'completed' },
                { departure_time: { $lt: currentDate } }
            ]
        })
            .populate('bookedBy.userId', 'name email')
            .select('from to departure_time estimatedArrivalTime price bookedBy status licensePlate description seats booked_seats')
            .sort({ departure_time: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Add computed fields for ride completion status
        const ridesWithStatus = rides.map(ride => {
            const allPassengersCompleted = ride.bookedBy.length > 0 &&
                ride.bookedBy.every(booking => booking.checkInStatus === 'completed');

            const somePassengersCompleted = ride.bookedBy.some(booking => booking.checkInStatus === 'completed');

            // Check if ETA + 2 hours has passed and ride is not completed -> mark as no completion
            let effectiveStatus = ride.status;
            if (ride.status !== 'completed' && !allPassengersCompleted) {
                const etaPlus2Hours = new Date(ride.estimatedArrivalTime.getTime() + (2 * 60 * 60 * 1000)); // ETA + 2 hours
                if (currentDate > etaPlus2Hours) {
                    effectiveStatus = 'no completion';
                }
            }

            return {
                ...ride,
                allPassengersCompleted,
                somePassengersCompleted,
                computedStatus: effectiveStatus,
                completedPassengers: ride.bookedBy.filter(booking => booking.checkInStatus === 'completed').length,
                totalPassengers: ride.bookedBy.length
            };
        });

        // Get total count for pagination
        const total = await Ride.countDocuments({
            userId: req.user.id,
            isPrivate: true,
            $or: [
                { status: 'completed' },
                { departure_time: { $lt: currentDate } }
            ]
        });

        res.status(200).json({
            history: ridesWithStatus,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error('Error fetching private ride history:', error);
        res.status(500).json({ error: 'Failed to fetch private ride history' });
    }
};

const getDrafts = async (req, res) => {
    try {
        const { role } = req.user;
        let query = { publishStatus: 'draft' };

        if (role === 'agency') {
            query.agencyId = req.user.id;
        } else if (role === 'user') {
            query.userId = req.user.id;
        }

        const drafts = await Ride.find(query)
            .populate('categoryId', 'from to')
            .populate('agencyId', 'name')
            .populate('userId', 'name')
            .sort({ created_at: -1 });

        const formattedDrafts = drafts.map(draft => ({
            id: draft._id,
            from: draft.from,
            to: draft.to,
            departure_time: draft.departure_time,
            estimatedArrivalTime: draft.estimatedArrivalTime,
            seats: draft.seats,
            price: draft.price,
            licensePlate: draft.licensePlate,
            description: draft.description,
            status: draft.status,
            publishStatus: draft.publishStatus,
            isPrivate: draft.isPrivate,
            category: draft.categoryId,
            agency: draft.agencyId,
            user: draft.userId,
            created_at: draft.created_at,
            updated_at: draft.updated_at
        }));

        res.json(formattedDrafts);
    } catch (error) {
        console.error('Error fetching drafts:', error);
        res.status(500).json({ error: 'Failed to fetch drafts' });
    }
};

const publishDraft = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.user;

        let query = { _id: id, publishStatus: 'draft' };

        if (role === 'agency') {
            query.agencyId = req.user.id;
        } else if (role === 'user') {
            query.userId = req.user.id;
        }

        const draft = await Ride.findOne(query);

        if (!draft) {
            return res.status(404).json({ error: 'Draft not found or you do not have permission to publish it' });
        }

        // Validate the draft before publishing
        const currentTime = new Date();
        const twoHoursFromNow = new Date(currentTime.getTime() + (2 * 60 * 60 * 1000));
        const thirtyDaysFromNow = new Date(currentTime.getTime() + (30 * 24 * 60 * 60 * 1000));

        // Check if departure time is valid for publishing
        if (draft.departure_time < currentTime) {
            return res.status(400).json({ error: 'Cannot publish a ride with a past departure time' });
        }

        if (draft.departure_time < twoHoursFromNow) {
            return res.status(400).json({ error: 'Rides must be published at least 2 hours before departure' });
        }

        if (draft.departure_time > thirtyDaysFromNow) {
            return res.status(400).json({ error: 'Cannot publish a ride more than 30 days in advance' });
        }

        // Check time range (6 AM to 10 PM)
        const hours = draft.departure_time.getHours();
        if (hours < 6 || hours > 22) {
            return res.status(400).json({ error: 'Rides are only available from 6:00 AM to 10:00 PM' });
        }

        // For private rides, check weekend restriction
        if (draft.isPrivate) {
            const dayOfWeek = draft.departure_time.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                return res.status(400).json({ error: 'Private rides cannot be scheduled on weekends' });
            }
        }

        // Update the draft to published
        draft.publishStatus = 'published';
        draft.status = 'active';
        await draft.save();

        await clearCache();

        res.json({
            message: 'Draft published successfully',
            ride: {
                id: draft._id,
                from: draft.from,
                to: draft.to,
                departure_time: draft.departure_time,
                seats: draft.seats,
                price: draft.price,
                publishStatus: draft.publishStatus,
                status: draft.status
            }
        });

    } catch (error) {
        console.error('Error publishing draft:', error);
        res.status(500).json({ error: 'Failed to publish draft' });
    }
};

const refreshCache = async (req, res) => {
    try {
        console.log('🔄 Manual cache refresh requested');
        await clearCache();
        await warmCache();

        res.json({
            message: 'Cache refreshed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error refreshing cache:', error);
        res.status(500).json({ error: 'Failed to refresh cache' });
    }
};

const cancelRide = async (req, res) => {
    try {
        const { rideId } = req.params;
        const { role } = req.user;

        // Only agencies can cancel rides
        if (role !== 'agency') {
            return res.status(403).json({
                error: 'Only agencies can cancel rides',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        // Find the ride and ensure it belongs to the agency
        const ride = await Ride.findOne({
            _id: rideId,
            agencyId: req.user.id
        }).populate('bookedBy', 'userId');

        if (!ride) {
            return res.status(404).json({
                error: 'Ride not found or you do not have permission to cancel it',
                code: 'RIDE_NOT_FOUND'
            });
        }

        // Check if ride is already canceled
        if (ride.status === 'canceled') {
            return res.status(400).json({
                error: 'Ride is already canceled',
                code: 'RIDE_ALREADY_CANCELED'
            });
        }

        // Check if ride has already departed
        const currentTime = new Date();
        if (ride.departure_time < currentTime) {
            return res.status(400).json({
                error: 'Cannot cancel a ride that has already departed',
                code: 'RIDE_ALREADY_DEPARTED'
            });
        }

        // Check if ride is too close to departure (30 minutes)
        const thirtyMinutesFromNow = new Date(currentTime.getTime() + (30 * 60 * 1000));
        if (ride.departure_time < thirtyMinutesFromNow) {
            return res.status(400).json({
                error: 'Cannot cancel a ride less than 30 minutes before departure',
                code: 'RIDE_TOO_CLOSE_TO_DEPARTURE'
            });
        }

        // Update ride status to canceled
        ride.status = 'canceled';
        await ride.save();

        // Send cancellation notifications to all passengers
        if (ride.bookedBy && ride.bookedBy.length > 0) {
            try {
                await messagingService.sendRideCancellationToPassengers(ride._id);
            } catch (notificationError) {
                console.error('Error sending cancellation notifications:', notificationError);
                // Don't fail the cancellation if notifications fail
            }
        }

        // Clear cache
        await clearCache();

        res.json({
            message: 'Ride canceled successfully',
            ride: {
                id: ride._id,
                from: ride.from,
                to: ride.to,
                departure_time: ride.departure_time,
                status: ride.status,
                booked_seats: ride.bookedBy ? ride.bookedBy.length : 0
            }
        });

    } catch (error) {
        console.error('Error canceling ride:', error);
        res.status(500).json({
            error: 'Failed to cancel ride',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
};

// GET /rides/:id/bookings - Get all bookings for a specific ride (for employee check-in)
const getRideBookings = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.user;

        // Validate ride ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Invalid ride ID',
                code: 'INVALID_RIDE_ID'
            });
        }

        // Find the ride and populate passenger information
        const ride = await Ride.findById(id)
            .populate('bookedBy.userId', 'name email')
            .populate('agencyId', 'name email')
            .populate('categoryId', 'from to averageTime')
            .lean();

        if (!ride) {
            return res.status(404).json({
                error: 'Ride not found',
                code: 'RIDE_NOT_FOUND'
            });
        }

        // Debug logging
        console.log('getRideBookings debug:', {
            userRole: role,
            userAgencyId: req.user.agencyId,
            userDestinationCategoryId: req.user.destinationCategoryId,
            rideAgencyId: ride.agencyId?._id,
            rideCategoryId: ride.categoryId?._id,
            userId: req.user.id
        });

        // Check permissions
        if (role === 'employee' || role === 'agency_employee') {
            // For employees, check if they can access this ride based on their destination category
            const userDestinationCategoryId = req.user.destinationCategoryId?.toString();
            const rideCategoryId = ride.categoryId?._id?.toString();
            
            console.log('Employee permission check:', {
                userDestinationCategoryId,
                rideCategoryId,
                match: userDestinationCategoryId === rideCategoryId
            });

            if (!userDestinationCategoryId || !rideCategoryId || userDestinationCategoryId !== rideCategoryId) {
                return res.status(403).json({
                    error: 'You do not have permission to access this ride\'s bookings',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    details: {
                        userDestinationCategoryId,
                        rideCategoryId,
                        userRole: role
                    }
                });
            }
        } else if (role === 'agency') {
            // For agencies, check if they created the ride
            const userAgencyId = req.user.id?.toString();
            const rideAgencyId = ride.agencyId?._id?.toString();

            console.log('Agency permission check:', {
                userAgencyId,
                rideAgencyId,
                match: userAgencyId === rideAgencyId
            });

            if (!userAgencyId || !rideAgencyId || userAgencyId !== rideAgencyId) {
                return res.status(403).json({
                    error: 'You do not have permission to access this ride\'s bookings',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    details: {
                        userAgencyId,
                        rideAgencyId,
                        userRole: role
                    }
                });
            }
        } else {
            return res.status(403).json({
                error: 'Only employees and agencies can access ride bookings',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        // Transform bookings to include passenger information
        const bookings = ride.bookedBy.map(booking => ({
            _id: booking._id || booking.bookingId,
            passenger: {
                _id: booking.userId._id,
                name: booking.userId.name,
                email: booking.userId.email
            },
            status: booking.checkInStatus,
            bookingId: booking.bookingId,
            createdAt: booking.createdAt || booking.created_at,
            completedAt: booking.completedAt
        }));

        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error fetching ride bookings:', error);
        res.status(500).json({
            error: 'Failed to fetch ride bookings',
            code: 'INTERNAL_SERVER_ERROR',
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
    cancelRide,
    getEmployeeRides,
    checkInPassenger,
    getRideHistory,
    getUserPrivateRides,
    getAvailablePrivateRides,
    generateCompletionPin,
    completeRideWithPin,
    getUserPrivateRideHistory,
    createDraft,
    getDrafts,
    publishDraft,
    refreshCache,
    warmCache,
    getAgencyRideHistory,
    getRideBookings
};

