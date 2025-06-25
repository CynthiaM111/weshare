import express from 'express';
const app = express();
const port = 5005;
import cors from 'cors';
import mongoose from 'mongoose';
import rideRoutes from './src/routes/rideRoutes.js';
import agencyRoutes from './src/routes/agencyRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import destinationCategoryRoutes from './src/routes/destinationCategoryRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import reminderRoutes from './src/routes/reminderRoutes.js';
import bookingRoutes from './src/routes/bookingRoutes.js';
import cronService from './src/services/cronService.js';
import { warmCache } from './src/controllers/rideController.js';

app.use(express.json());
import dotenv from 'dotenv';
dotenv.config();

app.use(cors());

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        // Warm up the cache on server startup
        try {
            await warmCache();
        } catch (error) {
            console.warn('Failed to warm cache on startup:', error.message);
        }
    })
    .catch((err) => {
        console.log(err);
    });


// Test Route
app.get('/', (req, res) => {
    res.send('Transit Backend Running!');
});

app.use('/api', rideRoutes);
app.use('/api', destinationCategoryRoutes);
app.use('/api', bookingRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reminders', reminderRoutes);

// Start the reminder scheduler
cronService.startReminderScheduler();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


