import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Schema } from 'mongoose';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB');

const agencySchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    contact_number: String,
    address: String,
    role: String,
    created_at: Date,
    updated_at: Date
});

const destinationCategorySchema = new mongoose.Schema({
    from: String,
    to: String,
    averageTime: Number,
    description: String,
    agencyId: Schema.Types.ObjectId,
    isActive: Boolean,
    createdAt: Date,
    updatedAt: Date
});

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    created_at: Date,
    updated_at: Date
});

const rideSchema = new mongoose.Schema({
    from: String,
    to: String,
    departure_time: Date,
    estimatedArrivalTime: Date,
    seats: Number,
    booked_seats: Number,
    price: Number,
    licensePlate: String,
    isPrivate: Boolean,
    status: String,
    agencyId: Schema.Types.ObjectId,
    categoryId: Schema.Types.ObjectId,
    bookedBy: [{
        userId: Schema.Types.ObjectId,
        checkInStatus: String,
        bookingId: String,
        createdAt: Date
    }],
    created_at: Date,
    updated_at: Date
});

const Agency = mongoose.model('Agency', agencySchema);
const DestinationCategory = mongoose.model('DestinationCategory', destinationCategorySchema);
const User = mongoose.model('User', userSchema);
const Ride = mongoose.model('Ride', rideSchema);

async function seedRidesAndBookings() {
    // Get agencies and their categories
    const agencies = await Agency.find();
    if (!agencies.length) {
        console.log('⚠️ No agencies found. Please run seedAgencies.js first.');
        return mongoose.disconnect();
    }

    // Get or create test users
    let users = await User.find({ role: 'user' });
    if (users.length === 0) {
        console.log('📝 Creating test users...');
        const testUsers = [];
        for (let i = 1; i <= 20; i++) {
            const user = new User({
                name: `User ${i}`,
                email: `user${i}@test.com`,
                password: 'hashedpassword123',
                role: 'user',
                created_at: new Date(),
                updated_at: new Date()
            });
            testUsers.push(user);
        }
        users = await User.insertMany(testUsers);
        console.log(`✅ Created ${users.length} test users`);
    } else {
        console.log(`📝 Found ${users.length} existing users`);
    }

    let totalRides = 0;
    let totalBookings = 0;

    for (const agency of agencies.slice(0, 5)) { // Only process first 5 agencies
        console.log(`📝 Processing agency: ${agency.name}`);

        const categories = await DestinationCategory.find({ agencyId: agency._id });
        if (!categories.length) {
            console.log(`⚠️ No categories found for agency ${agency.name}`);
            continue;
        }

        // Create rides for this agency
        for (let i = 0; i < 5; i++) { // 5 rides per agency
            const category = categories[Math.floor(Math.random() * categories.length)];
            const departureTime = new Date();
            departureTime.setDate(departureTime.getDate() + Math.floor(Math.random() * 30)); // Random date in next 30 days
            departureTime.setHours(6 + Math.floor(Math.random() * 16)); // Random hour between 6 AM and 10 PM

            const estimatedArrivalTime = new Date(departureTime);
            estimatedArrivalTime.setHours(estimatedArrivalTime.getHours() + category.averageTime);

            const ride = new Ride({
                from: category.from,
                to: category.to,
                departure_time: departureTime,
                estimatedArrivalTime: estimatedArrivalTime,
                seats: 10 + Math.floor(Math.random() * 20), // 10-30 seats
                booked_seats: 0,
                price: 20 + Math.floor(Math.random() * 30), // $20-50
                licensePlate: `ABC${Math.floor(100 + Math.random() * 900)}`,
                isPrivate: false,
                status: 'active',
                agencyId: agency._id,
                categoryId: category._id,
                bookedBy: [],
                created_at: new Date(),
                updated_at: new Date()
            });

            await ride.save();
            totalRides++;

            // Add some random bookings to this ride
            const numBookings = Math.floor(Math.random() * 5); // 0-4 bookings per ride
            for (let j = 0; j < numBookings; j++) {
                const user = users[Math.floor(Math.random() * users.length)];
                const checkInStatuses = ['pending', 'checked-in', 'completed'];
                const randomStatus = checkInStatuses[Math.floor(Math.random() * checkInStatuses.length)];

                ride.bookedBy.push({
                    userId: user._id,
                    checkInStatus: randomStatus,
                    bookingId: `booking_${ride._id}_${j}`,
                    createdAt: new Date()
                });
                totalBookings++;
            }

            ride.booked_seats = ride.bookedBy.length;
            await ride.save();
        }
    }

    console.log(`\n📊 Seeding Summary:`);
    console.log(`✅ Rides created: ${totalRides}`);
    console.log(`✅ Bookings created: ${totalBookings}`);
    console.log(`📈 Average bookings per ride: ${(totalBookings / totalRides).toFixed(1)}`);

    mongoose.disconnect();
}

seedRidesAndBookings().catch(err => {
    console.error('❌ Error:', err);
    mongoose.disconnect();
}); 