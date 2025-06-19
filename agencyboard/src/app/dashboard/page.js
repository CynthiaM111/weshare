// src/app/dashboard/page.js
'use client'; // Enable client-side features since we use hooks

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import CreateRideForm from '@/components/ride/CreateRideForm';
import CreateDestinationCategoryForm from '@/components/destination/CreateDestinationCategoryForm';
import SearchRideForm from '@/components/ride/SearchRideForm';
import RideList from '@/components/ride/RideList';

export default function Dashboard() {
    const [rides, setRides] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingRide, setEditingRide] = useState(null);
    const [currentAgency, setCurrentAgency] = useState(null);
    const [showCreateRideForm, setShowCreateRideForm] = useState(false);
    const [showCreateCategoryForm, setShowCreateCategoryForm] = useState(false);
    const [categoryFormData, setCategoryFormData] = useState({
        from: '',
        to: '',
        averageTime: '', // in hours
        description: '',
    });
    const [destinationCategories, setDestinationCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({
        departure_time: '',
        seats: '',
        agencyId: '',
        price: '',
        licensePlate: '',
        from: '', // Will be prefilled from category
        to: '', // Will be prefilled from category
        estimatedArrivalTime: '', // Will be calculated
    });
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchParams, setSearchParams] = useState({
        from: '',
        to: '',
        exact_match: false,
    });
    const [categories, setCategories] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({
        totalRides: 0,
        totalCategories: 0,
        totalBookings: 0,
        activeRides: 0,
        totalRevenue: 0,
        averageRating: 0
    });
    const router = useRouter();

    // Check auth status and fetch rides on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    // Fetch destination categories on mount
    useEffect(() => {
        if (isLoggedIn) {
            fetchData();
        }
    }, [isLoggedIn]);

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
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
                fetchData();
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

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            // Fetch rides
            const ridesResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/rides`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRides(ridesResponse.data);

            // Fetch categories
            const categoriesResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/destinations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter out duplicates by _id
            const uniqueCategories = Array.from(
                new Map(categoriesResponse.data.map(cat => [cat._id, cat])).values()
            );
            setCategories(uniqueCategories);

            // Fetch bookings (you'll need to implement this endpoint)
            try {
                const bookingsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBookings(bookingsResponse.data);
            } catch (error) {
                console.log('Bookings endpoint not implemented yet, using empty array');
                setBookings([]);
            }

            // Calculate stats
            const totalRides = ridesResponse.data.length;
            const totalCategories = uniqueCategories.length;
            const totalBookings = bookings.length;
            const activeRides = ridesResponse.data.filter(ride =>
                new Date(ride.departure_time) > new Date()
            ).length;
            const totalRevenue = ridesResponse.data.reduce((sum, ride) => sum + (ride.price || 0), 0);
            const averageRating = ridesResponse.data.length > 0
                ? ridesResponse.data.reduce((sum, ride) => sum + (ride.rating || 0), 0) / ridesResponse.data.length
                : 0;

            setStats({
                totalRides,
                totalCategories,
                totalBookings,
                activeRides,
                totalRevenue,
                averageRating: Math.round(averageRating * 10) / 10
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchParams.from || !searchParams.to) return;

        setIsSearching(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/rides/search`, {
                params: {
                    from: searchParams.from,
                    to: searchParams.to,
                    exact_match: searchParams.exact_match,
                    isPrivate: false // Agency dashboard only searches public rides
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setSearchResults(response.data);
            setHasSearched(true);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchResults([]);
        setSearchParams({ from: '', to: '', exact_match: false });
        setHasSearched(false);
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
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/rides/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            fetchData(); // Refresh ride list
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
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap');
                
                :root {
                    --font-syncopate: 'Syncopate', sans-serif;
                    --font-inter: 'Inter', sans-serif;
                }
                
                * {
                    font-family: var(--font-inter);
                }
                
                .gradient-text {
                    background: linear-gradient(135deg, #007BFF 0%, #00C6FF 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .gradient-bg {
                    background: linear-gradient(135deg, #007BFF 0%, #00C6FF 100%);
                }
                
                .card-shadow {
                    box-shadow: 0 4px 20px rgba(0, 123, 255, 0.1);
                }
                
                .soft-shadow {
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
                }
            `}</style>

            {!isLoggedIn ? (
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white rounded-3xl card-shadow p-8 text-center border border-blue-100">
                        <div className="mb-8">
                            <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold gradient-text mb-2" style={{ fontFamily: 'var(--font-syncopate)' }}>
                                WeShare
                            </h1>
                            <p className="text-gray-600 font-medium">Agency Portal</p>
                        </div>
                        <div className="space-y-4">
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full gradient-bg text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
                            >
                                Agency Login
                            </button>
                            <button
                                onClick={() => router.push('/signup')}
                                className="w-full border-2 border-blue-200 text-blue-600 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300"
                            >
                                Create Agency Account
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
                    {/* Header */}
                    <header className="bg-white/95 backdrop-blur-sm border-b border-blue-100">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between items-center py-8">
                                <div className="flex items-center space-x-6">
                                    <h1 className="text-3xl font-bold tracking-wide gradient-text" style={{ fontFamily: 'var(--font-syncopate)' }}>
                                        WeShare
                                    </h1>
                                    <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                                    <div className="flex flex-col">
                                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Dashboard</h2>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-gray-500 font-medium">Welcome back,</span>
                                            <span className="text-blue-600 font-semibold text-lg">{currentAgency.name}</span>
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-6">
                                    <div className="hidden md:flex items-center space-x-3 text-sm text-gray-600 font-medium bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>{currentAgency.email}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm font-semibold flex items-center space-x-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-2xl card-shadow border border-blue-100 p-6 hover:scale-105 transition-all duration-300">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Rides</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalRides}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl card-shadow border border-blue-100 p-6 hover:scale-105 transition-all duration-300">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Categories</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl card-shadow border border-blue-100 p-6 hover:scale-105 transition-all duration-300">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl card-shadow border border-blue-100 p-6 hover:scale-105 transition-all duration-300">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                        <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rides Management */}
                        <div className="bg-white rounded-2xl card-shadow border border-blue-100 overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-100">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Your Rides</h2>
                                        <p className="text-sm text-gray-600 font-medium mt-1">Manage and track all your transportation services</p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-white px-4 py-2 rounded-xl border border-blue-200 shadow-sm">
                                            <span className="text-sm text-gray-600 font-medium">Total Rides: </span>
                                            <span className="text-lg font-bold text-blue-600">{rides.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <RideList
                                    rides={rides}
                                    categories={categories}
                                    onRideCreated={fetchData}
                                />
                            </div>
                        </div>
                    </main>

                    {/* Modals */}
                    {showCreateRideForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="p-6 border-b border-blue-100">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Create New Ride</h3>
                                        <button
                                            onClick={() => setShowCreateRideForm(false)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors duration-300"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <CreateRideForm
                                        onRideCreated={() => {
                                            setShowCreateRideForm(false);
                                            fetchData();
                                        }}
                                        categories={categories}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {showCreateCategoryForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="p-6 border-b border-blue-100">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Add New Route</h3>
                                        <button
                                            onClick={() => setShowCreateCategoryForm(false)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors duration-300"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <CreateDestinationCategoryForm
                                        onCategoryCreated={() => {
                                            setShowCreateCategoryForm(false);
                                            fetchData();
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
