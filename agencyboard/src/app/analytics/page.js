'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function Analytics() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentAgency, setCurrentAgency] = useState(null);
    const [analyticsData, setAnalyticsData] = useState({
        bookings: [],
        rides: [],
        categories: [],
        timeRange: '30' // days
    });
    const [timeRange, setTimeRange] = useState('30');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const router = useRouter();

    // Check auth status on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    // Fetch analytics data when logged in
    useEffect(() => {
        if (isLoggedIn) {
            fetchAnalyticsData();
        }
    }, [isLoggedIn, timeRange, selectedCategory]);

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

    const fetchAnalyticsData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Fetch all necessary data
            const [bookingsResponse, ridesResponse, categoriesResponse] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/rides`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/destinations`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            // Filter data for current agency
            const agencyRides = ridesResponse.data.filter(ride =>
                ride.agencyId && ride.agencyId._id === currentAgency.id
            );

            const agencyRideIds = agencyRides.map(ride => ride._id);
            const agencyBookings = bookingsResponse.data.filter(booking =>
                agencyRideIds.includes(booking.rideId || booking.ride?._id)
            );

            const agencyCategories = categoriesResponse.data.filter(category =>
                category.agencyId === currentAgency.id
            );

            setAnalyticsData({
                bookings: agencyBookings,
                rides: agencyRides,
                categories: agencyCategories,
                timeRange
            });
        } catch (error) {
            console.error('Error fetching analytics data:', error);
        }
    };

    // Calculate date range based on timeRange
    const getDateRange = () => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(timeRange));
        return { startDate, endDate };
    };

    // Filter data by date range
    const filterDataByDateRange = (data, dateField) => {
        const { startDate, endDate } = getDateRange();
        return data.filter(item => {
            const itemDate = new Date(item[dateField]);
            return itemDate >= startDate && itemDate <= endDate;
        });
    };

    // Generate booking trends data
    const generateBookingTrendsData = () => {
        const filteredBookings = filterDataByDateRange(analyticsData.bookings, 'createdAt');
        const { startDate, endDate } = getDateRange();

        // Group bookings by date
        const bookingsByDate = {};
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            bookingsByDate[dateKey] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        filteredBookings.forEach(booking => {
            const dateKey = new Date(booking.createdAt).toISOString().split('T')[0];
            if (bookingsByDate[dateKey] !== undefined) {
                bookingsByDate[dateKey]++;
            }
        });

        return {
            labels: Object.keys(bookingsByDate),
            datasets: [{
                label: 'Bookings',
                data: Object.values(bookingsByDate),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
    };

    // Generate revenue trends data
    const generateRevenueTrendsData = () => {
        const filteredRides = filterDataByDateRange(analyticsData.rides, 'created_at');
        const { startDate, endDate } = getDateRange();

        // Group revenue by date
        const revenueByDate = {};
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            revenueByDate[dateKey] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        filteredRides.forEach(ride => {
            const dateKey = new Date(ride.created_at).toISOString().split('T')[0];
            if (revenueByDate[dateKey] !== undefined) {
                revenueByDate[dateKey] += (ride.price || 0) * (ride.booked_seats || 0);
            }
        });

        return {
            labels: Object.keys(revenueByDate),
            datasets: [{
                label: 'Revenue ($)',
                data: Object.values(revenueByDate),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
    };

    // Generate category performance data
    const generateCategoryPerformanceData = () => {
        const categoryStats = analyticsData.categories.map(category => {
            const categoryRides = analyticsData.rides.filter(ride =>
                ride.categoryId && (ride.categoryId._id === category._id || ride.categoryId === category._id)
            );

            const categoryBookings = analyticsData.bookings.filter(booking => {
                const bookingRide = analyticsData.rides.find(ride => ride._id === (booking.rideId || booking.ride?._id));
                return bookingRide && bookingRide.categoryId &&
                    (bookingRide.categoryId._id === category._id || bookingRide.categoryId === category._id);
            });

            const totalRevenue = categoryRides.reduce((sum, ride) =>
                sum + ((ride.price || 0) * (ride.booked_seats || 0)), 0
            );

            const totalSeats = categoryRides.reduce((sum, ride) => sum + (ride.seats || 0), 0);
            const bookedSeats = categoryRides.reduce((sum, ride) => sum + (ride.booked_seats || 0), 0);
            const utilizationRate = totalSeats > 0 ? (bookedSeats / totalSeats * 100).toFixed(1) : 0;

            return {
                name: `${category.from} → ${category.to}`,
                rides: categoryRides.length,
                bookings: categoryBookings.length,
                revenue: totalRevenue,
                avgRevenue: categoryRides.length > 0 ? totalRevenue / categoryRides.length : 0,
                utilizationRate: parseFloat(utilizationRate),
                totalSeats,
                bookedSeats
            };
        });

        // Sort by revenue (top performing first) and take top 3
        categoryStats.sort((a, b) => b.revenue - a.revenue);
        const top3Categories = categoryStats.slice(0, 3);

        return {
            labels: top3Categories.map(cat => cat.name),
            datasets: [{
                label: 'Revenue ($)',
                data: top3Categories.map(cat => cat.revenue),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };
    };

    // Generate booking status distribution
    const generateBookingStatusData = () => {
        const statusCounts = {
            pending: 0,
            'checked-in': 0,
            completed: 0
        };

        analyticsData.bookings.forEach(booking => {
            const status = booking.checkInStatus || 'pending';
            if (statusCounts[status] !== undefined) {
                statusCounts[status]++;
            }
        });

        return {
            labels: ['Pending', 'Checked In', 'Completed'],
            datasets: [{
                data: [statusCounts.pending, statusCounts['checked-in'], statusCounts.completed],
                backgroundColor: [
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(34, 197, 94, 0.8)'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };
    };

    // Generate seat utilization data
    const generateSeatUtilizationData = () => {
        const totalSeats = analyticsData.rides.reduce((sum, ride) => sum + (ride.seats || 0), 0);
        const bookedSeats = analyticsData.rides.reduce((sum, ride) => sum + (ride.booked_seats || 0), 0);
        const availableSeats = totalSeats - bookedSeats;

        return {
            labels: ['Booked Seats', 'Available Seats'],
            datasets: [{
                data: [bookedSeats, availableSeats],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(156, 163, 175, 0.8)'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };
    };

    // Calculate key metrics
    const calculateMetrics = () => {
        const totalBookings = analyticsData.bookings.length;
        const totalRides = analyticsData.rides.length;
        const totalRevenue = analyticsData.rides.reduce((sum, ride) =>
            sum + ((ride.price || 0) * (ride.booked_seats || 0)), 0
        );
        const totalSeats = analyticsData.rides.reduce((sum, ride) => sum + (ride.seats || 0), 0);
        const bookedSeats = analyticsData.rides.reduce((sum, ride) => sum + (ride.booked_seats || 0), 0);
        const utilizationRate = totalSeats > 0 ? (bookedSeats / totalSeats * 100).toFixed(1) : 0;
        const avgBookingValue = totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0;

        return {
            totalBookings,
            totalRides,
            totalRevenue,
            utilizationRate,
            avgBookingValue,
            totalSeats,
            bookedSeats
        };
    };

    const metrics = calculateMetrics();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg font-medium">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (!isLoggedIn) {
        router.push('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
            {/* Header */}
            <header className="bg-white/95 backdrop-blur-sm border-b border-blue-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-6">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                                <p className="text-gray-600">Comprehensive insights for {currentAgency.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            >
                                <option value="7">Last 7 days</option>
                                <option value="30">Last 30 days</option>
                                <option value="90">Last 90 days</option>
                                <option value="365">Last year</option>
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                                <p className="text-2xl font-bold text-gray-900">{metrics.totalBookings}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">${metrics.totalRevenue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Seat Utilization</p>
                                <p className="text-2xl font-bold text-gray-900">{metrics.utilizationRate}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-yellow-100 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg. Booking Value</p>
                                <p className="text-2xl font-bold text-gray-900">${metrics.avgBookingValue}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Performer Summary */}
                {(() => {
                    const categoryStats = analyticsData.categories.map(category => {
                        const categoryRides = analyticsData.rides.filter(ride =>
                            ride.categoryId && (ride.categoryId._id === category._id || ride.categoryId === category._id)
                        );

                        const categoryBookings = analyticsData.bookings.filter(booking => {
                            const bookingRide = analyticsData.rides.find(ride => ride._id === (booking.rideId || booking.ride?._id));
                            return bookingRide && bookingRide.categoryId &&
                                (bookingRide.categoryId._id === category._id || bookingRide.categoryId === category._id);
                        });

                        const totalRevenue = categoryRides.reduce((sum, ride) =>
                            sum + ((ride.price || 0) * (ride.booked_seats || 0)), 0
                        );

                        return {
                            name: `${category.from} → ${category.to}`,
                            rides: categoryRides.length,
                            bookings: categoryBookings.length,
                            revenue: totalRevenue
                        };
                    });

                    categoryStats.sort((a, b) => b.revenue - a.revenue);
                    const topPerformer = categoryStats[0];

                    if (!topPerformer || topPerformer.revenue === 0) return null;

                    return (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 mb-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">🏆 Top Performing Route</h3>
                                        <p className="text-lg font-semibold text-yellow-700">{topPerformer.name}</p>
                                        <p className="text-sm text-gray-600">
                                            {topPerformer.rides} rides • {topPerformer.bookings} bookings
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-green-600">${topPerformer.revenue.toLocaleString()}</p>
                                    <p className="text-sm text-gray-600">Total Revenue</p>
                                    <div className="mt-2">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                            Best Performer
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Booking Trends */}
                    <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Trends</h3>
                        <div className="h-80">
                            <Line
                                data={generateBookingTrendsData()}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                stepSize: 1
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Revenue Trends */}
                    <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
                        <div className="h-80">
                            <Line
                                data={generateRevenueTrendsData()}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                callback: function (value) {
                                                    return '$' + value.toLocaleString();
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Category Performance and Status Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Top Performing Categories */}
                    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 3 Performing Categories</h3>
                        <div className="space-y-4">
                            {(() => {
                                const categoryStats = analyticsData.categories.map(category => {
                                    const categoryRides = analyticsData.rides.filter(ride =>
                                        ride.categoryId && (ride.categoryId._id === category._id || ride.categoryId === category._id)
                                    );

                                    const categoryBookings = analyticsData.bookings.filter(booking => {
                                        const bookingRide = analyticsData.rides.find(ride => ride._id === (booking.rideId || booking.ride?._id));
                                        return bookingRide && bookingRide.categoryId &&
                                            (bookingRide.categoryId._id === category._id || bookingRide.categoryId === category._id);
                                    });

                                    const totalRevenue = categoryRides.reduce((sum, ride) =>
                                        sum + ((ride.price || 0) * (ride.booked_seats || 0)), 0
                                    );

                                    const totalSeats = categoryRides.reduce((sum, ride) => sum + (ride.seats || 0), 0);
                                    const bookedSeats = categoryRides.reduce((sum, ride) => sum + (ride.booked_seats || 0), 0);
                                    const utilizationRate = totalSeats > 0 ? (bookedSeats / totalSeats * 100).toFixed(1) : 0;

                                    return {
                                        name: `${category.from} → ${category.to}`,
                                        rides: categoryRides.length,
                                        bookings: categoryBookings.length,
                                        revenue: totalRevenue,
                                        avgRevenue: categoryRides.length > 0 ? totalRevenue / categoryRides.length : 0,
                                        utilizationRate: parseFloat(utilizationRate),
                                        totalSeats,
                                        bookedSeats
                                    };
                                });

                                // Sort by revenue (top performing first) and take top 3
                                categoryStats.sort((a, b) => b.revenue - a.revenue);
                                const top3Categories = categoryStats.slice(0, 3);

                                return top3Categories.map((category, index) => (
                                    <div key={index} className={`border rounded-xl p-4 ${index === 0 ? 'border-yellow-300 bg-yellow-50' : index === 1 ? 'border-gray-300 bg-gray-50' : 'border-orange-300 bg-orange-50'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-500' : 'bg-orange-500'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{category.name}</h4>
                                                    <p className="text-sm text-gray-600">
                                                        {category.rides} rides • {category.bookings} bookings
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-green-600">${category.revenue.toLocaleString()}</p>
                                                <p className="text-sm text-gray-600">Total Revenue</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-lg font-semibold text-blue-600">${category.avgRevenue.toFixed(0)}</p>
                                                <p className="text-xs text-gray-600">Avg. Revenue/Ride</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold text-purple-600">{category.utilizationRate}%</p>
                                                <p className="text-xs text-gray-600">Seat Utilization</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold text-orange-600">{category.bookedSeats}/{category.totalSeats}</p>
                                                <p className="text-xs text-gray-600">Seats Booked</p>
                                            </div>
                                        </div>

                                        {/* Performance indicator */}
                                        <div className="mt-3">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">Performance</span>
                                                <span className="font-semibold text-gray-900">
                                                    {category.revenue > 10000 ? 'Excellent' :
                                                        category.revenue > 5000 ? 'Good' :
                                                            category.revenue > 1000 ? 'Fair' : 'Needs Improvement'}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${category.revenue > 10000 ? 'bg-green-500' :
                                                        category.revenue > 5000 ? 'bg-blue-500' :
                                                            category.revenue > 1000 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${Math.min((category.revenue / 15000) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ));
                            })()}

                            {analyticsData.categories.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <p>No categories found</p>
                                    <p className="text-sm">Create some routes to see performance data</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Booking Status Distribution */}
                    <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Status Distribution</h3>
                        <div className="h-80">
                            <Doughnut
                                data={generateBookingStatusData()}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom'
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Seat Utilization */}
                <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Seat Utilization Overview</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="h-80">
                            <Pie
                                data={generateSeatUtilizationData()}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom'
                                        }
                                    }
                                }}
                            />
                        </div>
                        <div className="space-y-6">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-2">Seat Statistics</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-700 font-medium">Total Seats:</span>
                                        <span className="font-bold text-gray-900">{metrics.totalSeats}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700 font-medium">Booked Seats:</span>
                                        <span className="font-bold text-green-700">{metrics.bookedSeats}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700 font-medium">Available Seats:</span>
                                        <span className="font-bold text-gray-800">{metrics.totalSeats - metrics.bookedSeats}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700 font-medium">Utilization Rate:</span>
                                        <span className="font-bold text-blue-700">{metrics.utilizationRate}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-2">Performance Insights</h4>
                                <div className="space-y-2 text-sm">
                                    <p className="text-gray-600">
                                        {metrics.utilizationRate > 70 ?
                                            "Excellent seat utilization! Consider adding more rides to meet demand." :
                                            metrics.utilizationRate > 50 ?
                                                "Good utilization rate. Focus on marketing to increase bookings." :
                                                "Low utilization rate. Review pricing and marketing strategies."
                                        }
                                    </p>
                                    <p className="text-gray-600">
                                        Average booking value: <span className="font-semibold">${metrics.avgBookingValue}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
} 