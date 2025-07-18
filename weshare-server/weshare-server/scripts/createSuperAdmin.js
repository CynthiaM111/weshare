const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/weshare', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// User schema (simplified for this script)
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, trim: true, lowercase: true, sparse: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'agency_employee', 'super_admin'], default: 'user' },
    name: { type: String, required: true },
    contact_number: { type: String, required: true, unique: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    created_at: { type: Date, default: Date.now },
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

async function createSuperAdmin() {
    try {
        // Check if super admin already exists
        const existingAdmin = await User.findOne({ role: 'super_admin' });
        if (existingAdmin) {
            console.log('⚠️ Super admin already exists:');
            console.log(`   Email: ${existingAdmin.email}`);
            console.log(`   Name: ${existingAdmin.name}`);
            console.log(`   Contact: ${existingAdmin.contact_number}`);
            return;
        }

        // Super admin credentials
        const adminData = {
            name: 'WeShare Super Admin',
            email: 'admin@weshare.com',
            contact_number: '+250780000000',
            password: 'admin123456',
            role: 'super_admin',
            status: 'active'
        };

        // Hash password
        const hashedPassword = await bcrypt.hash(adminData.password, 10);

        // Create super admin user
        const superAdmin = new User({
            name: adminData.name,
            email: adminData.email,
            contact_number: adminData.contact_number,
            password: hashedPassword,
            role: adminData.role,
            status: adminData.status
        });

        await superAdmin.save();

        console.log('✅ Super admin created successfully!');
        console.log('📋 Login credentials:');
        console.log(`   Email: ${adminData.email}`);
        console.log(`   Password: ${adminData.password}`);
        console.log(`   Contact: ${adminData.contact_number}`);
        console.log('');
        console.log('🔐 You can now log in to the admin dashboard at:');
        console.log('   http://localhost:3000/login');

    } catch (error) {
        console.error('❌ Error creating super admin:', error);
    } finally {
        mongoose.disconnect();
    }
}

// Run the script
createSuperAdmin(); 