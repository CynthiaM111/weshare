import express from 'express';
const app = express();
const port = 5002;
import cors from 'cors';
import mongoose from 'mongoose';
import rideRoutes from './src/routes/rideRoutes.js';
import agencyRoutes from './src/routes/agencyRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import destinationCategoryRoutes from './src/routes/destinationCategoryRoutes.js';

app.use(express.json());
import dotenv from 'dotenv';
dotenv.config();

app.use(cors());

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
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
app.use('/api/agencies', agencyRoutes);
app.use('/api/auth', authRoutes);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


