const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const Ride = require('../src/models/ride');
const User = require('../src/models/user');
const Agency = require('../src/models/agency');
const DestinationCategory = require('../src/models/destinationCategory');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/weshare');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
    console.log('Connected to MongoDB');
    await seedData();
    mongoose.connection.close();
});

// Generate random Rwandan phone number
const generateRwandanPhoneNumber = () => {
    const prefixes = ['25072', '25073', '25078', '25079'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(1000000 + Math.random() * 9000000);
    return `+${prefix}${suffix}`;
};

// Generate random booking status
const getRandomStatus = () => {
    const statuses = ['pending', 'checked-in', 'completed'];
    const weights = [0.3, 0.4, 0.3]; // Adjust weights as needed
    let random = Math.random();
    let weightSum = 0;

    for (let i = 0; i < statuses.length; i++) {
        weightSum += weights[i];
        if (random <= weightSum) return statuses[i];
    }

    return statuses[0];
};

// Generate random booking ID
const generateBookingId = () => {
    return 'BK-' + Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Generate random completion PIN
const generateCompletionPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

// Validate Rwandan phone number format
const isValidRwandanPhoneNumber = (phoneNumber) => {
    const rwandanPhoneRegex = /^\+2507[2389]\d{7}$/;
    return rwandanPhoneRegex.test(phoneNumber);
};

// Validate license plate format
const isValidLicensePlate = (licensePlate) => {
    const trimmed = licensePlate.trim().toUpperCase();
    const regex = /^[A-Z0-9]{2,7}$/;
    return regex.test(trimmed);
};

// Generate random valid license plate
const generateValidLicensePlate = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const allChars = letters + numbers;

    // Generate 2-7 characters
    const length = Math.floor(2 + Math.random() * 6);
    let plate = '';

    for (let i = 0; i < length; i++) {
        plate += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return plate;
};

// Seed data function
const seedData = async () => {
    try {
        // 1. Get Shalom Express agency's destination categories
        const shalomAgency = await Agency.findOne({ email: 'shalom@gmail.com' });
        if (!shalomAgency) {
            console.log('Shalom Express agency not found');
            return;
        }

        const agencyId = shalomAgency._id;
        const categories = await DestinationCategory.find({ agencyId });
        console.log(`Found ${categories.length} destination categories for Shalom Express`);

        // 2. Get all rides for these categories
        const rides = await Ride.find({
            agencyId,
            categoryId: { $in: categories.map(c => c._id) }
        });
        console.log(`Found ${rides.length} rides for Shalom Express`);

        // 3. Create seed users (if needed)
        const existingUsers = await User.countDocuments({ role: 'user' });
        const usersToCreate = Math.max(0, 100 - existingUsers); // Create up to 100 users

        if (usersToCreate > 0) {
            console.log(`Creating ${usersToCreate} seed users...`);
            const userPromises = [];

            for (let i = 0; i < usersToCreate; i++) {
                const phone = generateRwandanPhoneNumber();
                const hashedPassword = await bcrypt.hash('secure123', 10);

                const user = new User({
                    name: faker.person.fullName(),
                    contact_number: phone,
                    password: hashedPassword,
                    role: 'user',
                    isVerified: true
                });

                userPromises.push(user.save());
            }

            await Promise.all(userPromises);
            console.log(`${usersToCreate} users created successfully`);
        }

        // 4. Get all available users
        const users = await User.find({ role: 'user' });
        console.log(`Total users available: ${users.length}`);

        if (users.length === 0) {
            console.log('No users available for bookings');
            return;
        }

        // 5. Create bookings for each ride
        console.log('Creating bookings for rides...');

        for (const ride of rides) {
            // Check if ride has valid license plate, if not, update it
            if (!isValidLicensePlate(ride.licensePlate)) {
                console.log(`Updating ride ${ride._id} - invalid license plate: ${ride.licensePlate}`);
                ride.licensePlate = generateValidLicensePlate();
                console.log(`Updated to: ${ride.licensePlate}`);
            }

            // Determine number of bookings for this ride (15-30, but not exceeding available seats)
            const maxBookings = Math.min(ride.seats, 30); // Don't exceed total seats
            const minBookings = Math.min(15, maxBookings); // Don't exceed maxBookings
            const bookingsCount = Math.floor(minBookings + Math.random() * (maxBookings - minBookings + 1));
            console.log(`Creating ${bookingsCount} bookings for ride ${ride._id} (total seats: ${ride.seats})`);

            // Select random users for bookings (may repeat users)
            const selectedUsers = [];
            for (let i = 0; i < bookingsCount; i++) {
                const randomUser = users[Math.floor(Math.random() * users.length)];
                selectedUsers.push(randomUser);
            }

            // Track if any booking is completed
            // let hasCompletedBooking = false;
            // let privateRideOwner = null;

            // Create bookings
            const bookingUpdates = selectedUsers.map(user => {
                const status = getRandomStatus();
                const bookingData = {
                    userId: user._id,
                    bookingId: generateBookingId(),
                    checkInStatus: status
                };



                return bookingData;
            });

            // Update the ride with bookings
            ride.bookedBy = bookingUpdates;
            ride.booked_seats = bookingUpdates.length;



            // Also update the booked_rides for each user
            for (let i = 0; i < selectedUsers.length; i++) {
                const user = selectedUsers[i];

                // Check if user has valid phone number, if not, update it
                if (!isValidRwandanPhoneNumber(user.contact_number)) {
                    console.log(`Updating user ${user._id} - invalid phone number: ${user.contact_number}`);
                    user.contact_number = generateRwandanPhoneNumber();
                    console.log(`Updated to: ${user.contact_number}`);
                }

                if (!user.booked_rides.includes(ride._id)) {
                    user.booked_rides.push(ride._id);
                    await user.save();
                }
            }

            await ride.save();
        }

        console.log('All bookings created successfully!');

    } catch (error) {
        console.error('Error seeding data:', error);
    }
};