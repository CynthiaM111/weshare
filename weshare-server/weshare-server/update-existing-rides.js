const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/weshare', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const Ride = require('./src/models/ride');

async function updateExistingRides() {
    try {
        console.log('🔄 Updating existing rides to published status...');

        // Update all rides that don't have publishStatus set to 'published'
        const result = await Ride.updateMany(
            { publishStatus: { $ne: 'published' } },
            { $set: { publishStatus: 'published' } }
        );

        console.log(`✅ Updated ${result.modifiedCount} rides to published status`);

        // Verify the update
        const totalRides = await Ride.countDocuments();
        const publishedRides = await Ride.countDocuments({ publishStatus: 'published' });
        const draftRides = await Ride.countDocuments({ publishStatus: 'draft' });

        console.log(`📊 Total rides: ${totalRides}`);
        console.log(`📊 Published rides: ${publishedRides}`);
        console.log(`📊 Draft rides: ${draftRides}`);

        console.log('🎉 All existing rides are now visible to the public!');

    } catch (error) {
        console.error('❌ Error updating rides:', error);
    } finally {
        mongoose.connection.close();
    }
}

updateExistingRides(); 