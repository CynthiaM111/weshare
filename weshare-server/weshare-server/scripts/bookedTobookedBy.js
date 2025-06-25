import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ride from '../src/models/ride';

dotenv.config();

const Ride = require('../src/models/ride');



async function main() {
    try {


        const rides = await db.collection('rides').find({ booked_users: { $exists: true } }).toArray();

        for (const ride of rides) {
            if (ride.booked_users) {

                const newBookedBy = ride.booked_users.map(userId => ({
                    userId,
                    checkInStatus: 'pending',
                    bookingId: new mongoose.Types.ObjectId().toString(),
                }));

                await db.collection('rides').updateOne(
                    { _id: ride._id },
                    {
                        $set: { bookedBy: newBookedBy, booked_seats: newBookedBy.length },
                        $unset: { booked_users: "" }, // ✅ This should now actually work
                    }
                );

                console.log(`✅ Migrated ride with _id: ${ride._id}`);
            }
        }

        // Double check:
        const residualUsers = await db.collection('rides').countDocuments({ booked_users: { $exists: true } });
        const stringUserIds = await db.collection('rides').countDocuments({ "bookedBy.userId": { $type: "string" } });

        console.log("Rides with booked_users still present:", residualUsers);
        console.log("Rides with string bookedBy.userId:", stringUserIds);

        // Add isPrivate field to all rides that don't have it
        console.log('Adding isPrivate field to rides...');
        const updateResult = await db.collection('rides').updateMany(
            { isPrivate: { $exists: false } },
            { $set: { isPrivate: false } }
        );
        console.log(`Updated ${updateResult.modifiedCount} rides with isPrivate field`);

        // 🔄 Sync indexes to remove outdated unique constraint
        console.log('🔄 Syncing Ride model indexes...');
        const indexResult = await Ride.syncIndexes();
        console.log('✅ Index sync result:', indexResult);

        console.log('Script completed successfully');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    }
}

main();

