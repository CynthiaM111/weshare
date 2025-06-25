import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Schema } from 'mongoose';


dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB');
mongoose.connection.db;

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

const Agency = mongoose.model('Agency', agencySchema);
const DestinationCategory = mongoose.model('DestinationCategory', destinationCategorySchema);

// A list of many distinct Rwandan-like destinations for variety
const cities = [
    'Kigali', 'Huye', 'Musanze', 'Rubavu', 'Nyagatare',
    'Gisenyi', 'Rusizi', 'Muhanga', 'Kibuye', 'Nyamagabe',
    'Byumba', 'Gicumbi', 'Rwamagana', 'Bugesera', 'Ngoma'
];

function getRandomFromTo() {
    let from = cities[Math.floor(Math.random() * cities.length)];
    let to = cities[Math.floor(Math.random() * cities.length)];
    while (to === from) {
        to = cities[Math.floor(Math.random() * cities.length)];
    }
    return { from, to };
}

async function seed10CategoriesPerAgency() {
    const agencies = await Agency.find(); // all agencies

    if (!agencies.length) {
        console.log('⚠️ No agencies found. Please run seedAgencies.js first.');
        return mongoose.disconnect();
    }

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const agency of agencies) {
        console.log(`📝 Processing agency: ${agency.name} (${agency.email})`);

        for (let i = 0; i < 10; i++) {
            const { from, to } = getRandomFromTo();

            try {
                // Check if category already exists
                const existingCategory = await DestinationCategory.findOne({
                    from,
                    to,
                    agencyId: agency._id
                });

                if (existingCategory) {
                    console.log(`⏭️ Skipping existing category: ${from} → ${to}`);
                    totalSkipped++;
                    continue;
                }

                // Create new category
                const category = new DestinationCategory({
                    from,
                    to,
                    averageTime: 2 + Math.floor(Math.random() * 3), // between 2–4 hrs
                    description: `Route from ${from} to ${to}`,
                    agencyId: agency._id,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                await category.save();
                console.log(`✅ Created category: ${from} → ${to}`);
                totalInserted++;

            } catch (error) {
                if (error.code === 11000) {
                    console.log(`⏭️ Duplicate category skipped: ${from} → ${to}`);
                    totalSkipped++;
                } else {
                    console.error(`❌ Error creating category ${from} → ${to}:`, error.message);
                }
            }
        }
    }

    console.log(`\n📊 Seeding Summary:`);
    console.log(`✅ New categories created: ${totalInserted}`);
    console.log(`⏭️ Duplicate categories skipped: ${totalSkipped}`);
    console.log(`📈 Total processed: ${totalInserted + totalSkipped}`);

    mongoose.disconnect();
}

seed10CategoriesPerAgency().catch(err => {
    console.error('❌ Error:', err);
    mongoose.disconnect();
});