// src/app/dashboard/page.js
'use client'; // Enable client-side features since we use hooks

import { useState, useEffect } from 'react';

export default function Dashboard() {
    const [rides, setRides] = useState([]);
    const [formData, setFormData] = useState({
        from: '',
        to: '',
        departure_time: '',
        seats: '',
        agencyId: '662f1234abcd5678ef901234', // Hardcoded for now, replace with real ID
        price: '',
    });

    // Fetch rides on mount
    useEffect(() => {
        fetchRides();
    }, []);

    const fetchRides = async () => {
        try {
            const res = await fetch('http://localhost:5002/api/rides');
            const data = await res.json();
            setRides(data);
        } catch (error) {
            console.error('Error fetching rides:', error);
        }
    };

    // Handle form input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Create a new ride
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5002/api/rides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    seats: Number(formData.seats), // Convert to number
                    price: Number(formData.price) || 0,
                }),
            });
            if (res.ok) {
                fetchRides(); // Refresh ride list
                setFormData({ ...formData, from: '', to: '', departure_time: '', seats: '', price: '' }); // Reset form
            }
        } catch (error) {
            console.error('Error creating ride:', error);
        }
    };

    // Delete a ride
    const handleDelete = async (id) => {
        try {
            const res = await fetch(`http://localhost:5002/api/rides/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) fetchRides(); // Refresh ride list
        } catch (error) {
            console.error('Error deleting ride:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Agency Dashboard</h1>

            {/* Create Ride Form */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Create Вам New Ride</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-600">Start Location</label>
                        <input
                            type="text"
                            name="from"
                            value={formData.from}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600">Destination</label>
                        <input
                            type="text"
                            name="to"
                            value={formData.to}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600">Departure Time</label>
                        <input
                            type="datetime-local"
                            name="departure_time"
                            value={formData.departure_time}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600">Seats</label>
                        <input
                            type="number"
                            name="seats"
                            value={formData.seats}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md"
                            min="1"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600">Price (optional)</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md"
                            step="0.01"
                        />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Create Ride
                    </button>
                </form>
            </div>

            {/* Ride List */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Manage Rides</h2>
                {rides.length === 0 ? (
                    <p className="text-gray-500">No rides available.</p>
                ) : (
                    <ul className="space-y-4">
                        {rides.map((ride) => (
                            <li key={ride._id} className="flex justify-between items-center p-4 border rounded-md">
                                <div>
                                    <p className="font-medium">
                                        {ride.from} to {ride.to}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(ride.departure_time).toLocaleString()} | Seats: {ride.seats} | Booked: {ride.booked_seats} | Price: ${ride.price}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(ride._id)}
                                    className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}