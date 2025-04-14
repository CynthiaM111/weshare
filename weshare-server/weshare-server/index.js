const express = require('express');
const app = express();
const port = 5002;
const cors = require('cors');
const mongoose = require('mongoose');
const rideRoutes = require('./src/routes/rideRoutes');
const agencyRoutes = require('./src/routes/agencyRoutes');
const authRoutes = require('./src/routes/authRoutes');

app.use(express.json());
require('dotenv').config();

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
app.use('/api/agencies', agencyRoutes);
app.use('/api/auth', authRoutes);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


