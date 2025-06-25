'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function RideHistory() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentAgency, setCurrentAgency] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rideHistory, setRideHistory] = useState([]);
    const [loadingRideHistory, setLoadingRideHistory] = useState(false);
    const [rideHistoryPeriod, setRideHistoryPeriod] = useState('7'); // '3', '7', '30', '90'
    const [historyFilters, setHistoryFilters] = useState({
        statusFilter: 'all', // 'all', 'completed', 'cancelled', 'active'
        sortBy: 'departure', // 'departure', 'price', 'revenue', 'bookings'
        sortOrder: 'desc' // 'asc', 'desc'
    });
    const [filteredHistory, setFilteredHistory] = useState([]);
    const router = useRouter();

    // Check auth status on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    // Fetch ride history when period changes
    useEffect(() => {
        if (isLoggedIn) {
            fetchRideHistory();
        }
    }, [isLoggedIn, rideHistoryPeriod]);

    // Apply filters when history or filters change
    useEffect(() => {
        if (rideHistory.length >= 0) {
            const filtered = applyHistoryFilters(rideHistory);
            setFilteredHistory(filtered);
        }
    }, [rideHistory, historyFilters]);

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoggedIn(false);
                setLoading(false);
                router.push('/login');
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
            } else {
                setIsLoggedIn(false);
                router.push('/login');
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            setIsLoggedIn(false);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const fetchRideHistory = async () => {
        setLoadingRideHistory(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/rides/history`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { days: rideHistoryPeriod }
            });

            setRideHistory(response.data);
        } catch (error) {
            console.error('Error fetching ride history:', error);
            setRideHistory([]);
        } finally {
            setLoadingRideHistory(false);
        }
    };

    const applyHistoryFilters = (history) => {
        let filtered = [...history];

        // Filter by status
        if (historyFilters.statusFilter !== 'all') {
            filtered = filtered.filter(ride => {
                const now = new Date();
                const departureDate = new Date(ride.departure_time);

                switch (historyFilters.statusFilter) {
                    case 'completed':
                        return departureDate < now;
                    case 'active':
                        return departureDate > now;
                    case 'cancelled':
                        return ride.status === 'cancelled';
                    default:
                        return true;
                }
            });
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (historyFilters.sortBy) {
                case 'price':
                    aValue = a.price || 0;
                    bValue = b.price || 0;
                    break;
                case 'revenue':
                    aValue = (a.price || 0) * (a.booked_seats || 0);
                    bValue = (b.price || 0) * (b.booked_seats || 0);
                    break;
                case 'bookings':
                    aValue = a.booked_seats || 0;
                    bValue = b.booked_seats || 0;
                    break;
                case 'departure':
                default:
                    aValue = new Date(a.departure_time);
                    bValue = new Date(b.departure_time);
                    break;
            }

            if (historyFilters.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    };

    const getRideStatus = (ride) => {
        const now = new Date();
        const departureDate = new Date(ride.departure_time);
        const availableSeats = ride.seats - (ride.booked_seats || 0);
        const occupancyRate = (ride.booked_seats || 0) / ride.seats;

        if (departureDate < now) {
            return { status: 'completed', color: 'bg-gray-500 text-white', text: 'Completed' };
        } else if (availableSeats === 0) {
            return { status: 'full', color: 'bg-red-500 text-white', text: 'Full' };
        } else if (occupancyRate >= 0.8) {
            return { status: 'nearly-full', color: 'bg-orange-500 text-white', text: 'Nearly Full' };
        } else {
            return { status: 'available', color: 'bg-green-500 text-white', text: 'Available' };
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleLogout = () => {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            setIsLoggedIn(false);
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
                    <p className="text-gray-600 text-lg font-medium">Loading ride history...</p>
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
            `}</style>

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
                                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Ride History</h2>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-500 font-medium">Agency:</span>
                                        <span className="text-blue-600 font-semibold text-lg">{currentAgency?.name}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm font-semibold flex items-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    <span>Dashboard</span>
                                </button>
                                <button
                                    onClick={() => router.push('/analytics')}
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm font-semibold flex items-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span>Analytics</span>
                                </button>
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
                    {/* Page Header */}
                    <div className="bg-white rounded-2xl card-shadow border border-blue-100 overflow-hidden mb-8">
                        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-6 py-4 border-b border-indigo-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Ride History</h2>
                                    <p className="text-sm text-gray-600 font-medium mt-1">View and analyze your past and current rides</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="bg-white px-4 py-2 rounded-xl border border-indigo-200 shadow-sm">
                                        <span className="text-sm text-gray-600 font-medium">Total Rides: </span>
                                        <span className="text-lg font-bold text-indigo-600">{filteredHistory.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex flex-wrap gap-4 items-center">
                                {/* Time Period Filter */}
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm font-medium text-gray-700">Time Period:</label>
                                    <select
                                        value={rideHistoryPeriod}
                                        onChange={(e) => setRideHistoryPeriod(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 bg-white"
                                    >
                                        <option value="3">Last 3 Days</option>
                                        <option value="7">Last 7 Days</option>
                                        <option value="30">Last 30 Days</option>
                                        <option value="90">Last 90 Days</option>
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm font-medium text-gray-700">Status:</label>
                                    <select
                                        value={historyFilters.statusFilter}
                                        onChange={(e) => setHistoryFilters(prev => ({ ...prev, statusFilter: e.target.value }))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 bg-white"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="completed">Completed</option>
                                        <option value="active">Active</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                {/* Sort by */}
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm font-medium text-gray-700">Sort by:</label>
                                    <select
                                        value={historyFilters.sortBy}
                                        onChange={(e) => setHistoryFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 bg-white"
                                    >
                                        <option value="departure">Departure Time</option>
                                        <option value="price">Price</option>
                                        <option value="revenue">Revenue</option>
                                        <option value="bookings">Bookings</option>
                                    </select>
                                </div>

                                {/* Sort order */}
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm font-medium text-gray-700">Order:</label>
                                    <select
                                        value={historyFilters.sortOrder}
                                        onChange={(e) => setHistoryFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 bg-white"
                                    >
                                        <option value="desc">Newest First</option>
                                        <option value="asc">Oldest First</option>
                                    </select>
                                </div>

                                {/* Clear filters */}
                                <button
                                    onClick={() => setHistoryFilters({
                                        statusFilter: 'all',
                                        sortBy: 'departure',
                                        sortOrder: 'desc'
                                    })}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Ride History Content */}
                    <div className="bg-white rounded-2xl card-shadow border border-blue-100 overflow-hidden">
                        <div className="p-6">
                            {loadingRideHistory ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading ride history...</p>
                                </div>
                            ) : filteredHistory.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredHistory.map((ride) => {
                                        const departureDate = new Date(ride.departure_time);
                                        const rideStatus = getRideStatus(ride);
                                        const revenue = (ride.price || 0) * (ride.booked_seats || 0);

                                        return (
                                            <div key={ride._id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="text-lg font-semibold text-gray-900">
                                                            {ride.from} → {ride.to}
                                                        </h4>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {departureDate.toLocaleDateString('en-US', {
                                                                weekday: 'short',
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })} at {departureDate.toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${rideStatus.color}`}>
                                                        {rideStatus.text}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div className="text-center">
                                                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(ride.price || 0)}</p>
                                                        <p className="text-xs text-gray-500">Price</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-2xl font-bold text-green-600">{ride.booked_seats || 0}</p>
                                                        <p className="text-xs text-gray-500">Booked</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-2xl font-bold text-purple-600">{ride.seats - (ride.booked_seats || 0)}</p>
                                                        <p className="text-xs text-gray-500">Available</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(revenue)}</p>
                                                        <p className="text-xs text-gray-500">Revenue</p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div className="text-sm text-gray-500">
                                                        {ride.licensePlate && `Vehicle: ${ride.licensePlate}`}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {ride.seats} total seats
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No ride history found</h3>
                                    <p className="text-gray-500 mb-4">
                                        {Object.values(historyFilters).some(val => val !== 'all' && val !== 'departure' && val !== 'desc')
                                            ? 'Try adjusting your filters or select a different time period.'
                                            : `No rides found for the last ${rideHistoryPeriod} days.`}
                                    </p>
                                    <button
                                        onClick={() => router.push('/dashboard')}
                                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
                                    >
                                        Back to Dashboard
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
} 