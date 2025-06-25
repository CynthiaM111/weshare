import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

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
    updated_at: Date,
    __v: Number
});

const Agency = mongoose.model('Agency', agencySchema);

async function seedAgencies() {
    const passwordPlain = 'secure123';
    const hashedPassword = await bcrypt.hash(passwordPlain, 10);

    const agencies = Array.from({ length: 50 }).map((_, i) => ({
        name: `Agency ${i + 1}`,
        email: `agency${i + 1}@demo.com`,
        password: hashedPassword,
        contact_number: `+25078${Math.floor(1000000 + Math.random() * 8999999)}`,
        address: `District ${i % 5 + 1}, Rwanda`,
        role: 'agency',
        created_at: new Date(),
        updated_at: new Date(),
        __v: 0
    }));

    await Agency.insertMany(agencies);
    console.log('✅ Inserted 50 agencies with hashed passwords');
    mongoose.disconnect();
}

seedAgencies().catch(err => {
    console.error('❌ Error inserting agencies:', err);
    mongoose.disconnect();
});
