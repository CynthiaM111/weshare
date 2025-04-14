// src/app/dashboard/page.js
'use client'; // Enable client-side features since we use hooks

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Dashboard() {
    const [rides, setRides] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingRide, setEditingRide] = useState(null);
    const [currentAgency, setCurrentAgency] = useState(null);
    const [formData, setFormData] = useState({
        from: '',
        to: '',
        departure_time: '',
        seats: '',
        agencyId: '',
        price: '',
    });
    const router = useRouter();

    // Check auth status and fetch rides on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }
            const response = await axios.get('http://localhost:5002/api/auth/status', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data.isAuthenticated && response.data.role === 'agency') {
                setIsLoggedIn(true);
                setCurrentAgency({
                    id: response.data.userId,
                    email: response.data.email,
                    name: response.data.name,
                });
                fetchRides();
            } else {
                setIsLoggedIn(false);
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            setIsLoggedIn(false);
        } finally {
            setLoading(false);
        }
    };

    const fetchRides = async () => {
        try {
            const response = await axios.get('http://localhost:5002/api/rides');
            setRides(response.data);
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
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }
            if (editingRide) {
                await axios.put(`http://localhost:5002/api/rides/${editingRide._id}`, {
                    ...formData,
                    seats: Number(formData.seats),
                    price: Number(formData.price) || 0,
                    agencyId: currentAgency.id,
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            } else {
                await axios.post('http://localhost:5002/api/rides', {
                    ...formData,
                    seats: Number(formData.seats),
                    price: Number(formData.price) || 0,
                    agencyId: currentAgency.id,
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }
            fetchRides(); // Refresh ride list
            setFormData({ ...formData, from: '', to: '', departure_time: '', seats: '', price: '' }); // Reset form
        } catch (error) {
            console.error('Error creating ride:', error);
        }
    };
    const handleEdit = (ride) => {
        setEditingRide(ride);
        setFormData({
            from: ride.from,
            to: ride.to,
            departure_time: ride.departure_time.split('.')[0], // Remove milliseconds for datetime-local input
            seats: ride.seats,
            price: ride.price,
        });
    };

    // Delete a ride
    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }
            const response = await axios.delete(`http://localhost:5002/api/rides/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            fetchRides(); // Refresh ride list
        } catch (error) {
            console.error('Error deleting ride:', error);
        }
    };

    const handleLogout = () => {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            setIsLoggedIn(false);
            setRides([]);
            router.push('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <h1 className="text-4xl font-bold text-indigo-600 mb-6">Agency Portal</h1>
                    <p className="text-gray-600 mb-8">Manage your transportation services</p>
                    <div className="space-y-4">
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition duration-200"
                        >
                            Agency Login
                        </button>
                        <button
                            onClick={() => router.push('/signup')}
                            className="w-full border-2 border-indigo-600 text-indigo-600 py-3 px-4 rounded-lg font-medium hover:bg-indigo-50 transition duration-200"
                        >
                            Create Agency Account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <h1 className="text-3xl font-bold text-gray-800">Ride Management Dashboard</h1>
                    {currentAgency && (
                        <p className="text-gray-600">Welcome, {currentAgency.name}</p>
                    )}
                </div>
                <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                    Logout
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ride Form */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                        {editingRide ? 'Edit Ride' : 'Create New Ride'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-600 mb-1">From</label>
                            <input
                                type="text"
                                name="from"
                                value={formData.from}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-md text-black"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">To</label>
                            <input
                                type="text"
                                name="to"
                                value={formData.to}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-md text-black"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1 text-black">Departure Time</label>
                            <input
                                type="datetime-local"
                                name="departure_time"
                                value={formData.departure_time}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-md text-black"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Available Seats</label>
                            <input
                                type="number"
                                name="seats"
                                value={formData.seats}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-md text-black"
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Price ($)</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-md text-black"
                                step="0.01"
                                required
                            />
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex-1"
                            >
                                {editingRide ? 'Update Ride' : 'Create Ride'}
                            </button>
                            {editingRide && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingRide(null);
                                        setFormData({ from: '', to: '', departure_time: '', seats: '', price: '' });
                                    }}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex-1"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Ride List */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Rides</h2>
                    {rides.length === 0 ? (
                        <p className="text-gray-500">No rides available. Create your first ride!</p>
                    ) : (
                        <div className="space-y-4">
                            {rides.map((ride) => (
                                <div key={ride._id} className="border rounded-md p-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-medium text-lg text-black">
                                                {ride.from} → {ride.to}
                                            </h3>
                                            <p className="text-gray-600 text-sm">
                                                {new Date(ride.departure_time).toLocaleString()}
                                            </p>
                                            <div className="flex space-x-4 mt-2 text-sm text-black">
                                                <span>Seats: {ride.seats}</span>
                                                <span>Price: ${ride.price}</span>
                                                {ride.booked_seats > 0 && (
                                                    <span className="text-green-600">
                                                        Booked: {ride.booked_seats}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEdit(ride)}
                                                className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 text-sm"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ride._id)}
                                                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
