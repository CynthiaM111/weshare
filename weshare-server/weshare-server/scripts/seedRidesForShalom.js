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
const Ride = mongoose.model('Ride', rideSchema);

// Generate unique license plates
function generateLicensePlate() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let plate = '';

    // Generate 2-3 letters
    const letterCount = Math.floor(Math.random() * 2) + 2; // 2 or 3 letters
    for (let i = 0; i < letterCount; i++) {
        plate += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    // Generate 3-4 numbers
    const numberCount = Math.floor(Math.random() * 2) + 3; // 3 or 4 numbers
    for (let i = 0; i < numberCount; i++) {
        plate += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return plate;
}

// Generate departure times for the next 30 days
function generateDepartureTime() {
    const now = new Date();
    const futureDate = new Date(now.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date in next 30 days

    // Set random hour between 6 AM and 10 PM
    const hour = 6 + Math.floor(Math.random() * 16);
    futureDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

    return futureDate;
}

// Generate price based on average time
function generatePrice(averageTime) {
    const basePrice = 15; // Base price
    const pricePerHour = 8; // Price per hour
    const randomFactor = 0.8 + Math.random() * 0.4; // ±20% variation

    return Math.round((basePrice + (averageTime * pricePerHour)) * randomFactor);
}

async function seedRidesForShalom() {
    try {
        // Find the agency with email shalom@gmail.com
        const agency = await Agency.findOne({ email: 'shalom@gmail.com' });

        if (!agency) {
            console.log('❌ Agency with email shalom@gmail.com not found');
            return mongoose.disconnect();
        }

        console.log(`✅ Found agency: ${agency.name} (${agency.email})`);

        // Get all destination categories for this agency
        const categories = await DestinationCategory.find({ agencyId: agency._id });

        if (!categories.length) {
            console.log('❌ No destination categories found for this agency');
            return mongoose.disconnect();
        }

        console.log(`📋 Found ${categories.length} destination categories`);

        let totalRidesCreated = 0;
        let totalRidesSkipped = 0;

        // Process each category
        for (const category of categories) {
            console.log(`\n📝 Processing category: ${category.from} → ${category.to}`);

            // Check how many rides already exist for this category
            const existingRidesCount = await Ride.countDocuments({
                categoryId: category._id,
                agencyId: agency._id
            });

            console.log(`   Existing rides: ${existingRidesCount}`);

            // Calculate how many rides to add (max 10 total)
            const ridesToAdd = Math.max(0, 10 - existingRidesCount);

            if (ridesToAdd === 0) {
                console.log(`   ⏭️ Category already has 10 rides, skipping`);
                totalRidesSkipped += 10;
                continue;
            }

            console.log(`   Adding ${ridesToAdd} new rides...`);

            // Create rides for this category
            for (let i = 0; i < ridesToAdd; i++) {
                try {
                    const departureTime = generateDepartureTime();
                    const estimatedArrivalTime = new Date(departureTime);
                    estimatedArrivalTime.setHours(estimatedArrivalTime.getHours() + category.averageTime);

                    const ride = new Ride({
                        from: category.from,
                        to: category.to,
                        departure_time: departureTime,
                        estimatedArrivalTime: estimatedArrivalTime,
                        seats: 12 + Math.floor(Math.random() * 18), // 12-30 seats
                        booked_seats: Math.floor(Math.random() * 3), // 0-2 random bookings
                        price: generatePrice(category.averageTime),
                        licensePlate: generateLicensePlate(),
                        isPrivate: false,
                        status: 'active',
                        agencyId: agency._id,
                        categoryId: category._id,
                        bookedBy: [],
                        created_at: new Date(),
                        updated_at: new Date()
                    });

                    await ride.save();
                    totalRidesCreated++;

                    console.log(`   ✅ Created ride #${i + 1}: ${departureTime.toLocaleDateString()} at ${departureTime.toLocaleTimeString()} - $${ride.price}`);

                } catch (error) {
                    if (error.code === 11000) {
                        console.log(`   ⏭️ Duplicate ride skipped (likely same departure time)`);
                        totalRidesSkipped++;
                    } else {
                        console.error(`   ❌ Error creating ride:`, error.message);
                    }
                }
            }
        }

        // Final summary
        console.log(`\n📊 Seeding Summary:`);
        console.log(`✅ Total rides created: ${totalRidesCreated}`);
        console.log(`⏭️ Total rides skipped: ${totalRidesSkipped}`);
        console.log(`📈 Total categories processed: ${categories.length}`);

        // Verify results
        const totalRidesForAgency = await Ride.countDocuments({ agencyId: agency._id });
        console.log(`🔍 Total rides for agency: ${totalRidesForAgency}`);

        // Show breakdown by category
        console.log(`\n📋 Rides per category:`);
        for (const category of categories) {
            const rideCount = await Ride.countDocuments({
                categoryId: category._id,
                agencyId: agency._id
            });
            console.log(`   ${category.from} → ${category.to}: ${rideCount} rides`);
        }

    } catch (error) {
        console.error('❌ Error in seeding process:', error);
    } finally {
        mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

seedRidesForShalom().catch(err => {
    console.error('❌ Fatal error:', err);
    mongoose.disconnect();
}); 