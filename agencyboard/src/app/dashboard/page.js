// src/app/dashboard/page.js
'use client'; // Enable client-side features since we use hooks

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import axios from 'axios';
import CreateRideForm from '@/components/ride/CreateRideForm';
import CreateDestinationCategoryForm from '@/components/destination/CreateDestinationCategoryForm';
import SearchRideForm from '@/components/ride/SearchRideForm';
import RideList from '@/components/ride/RideList';

export default function Dashboard() {
    const [rides, setRides] = useState([]);
    const [agencyRides, setAgencyRides] = useState([]);
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
    const [lastUpdated, setLastUpdated] = useState(null);
    const [previousBookingCount, setPreviousBookingCount] = useState(0);
    const [hasNewBookings, setHasNewBookings] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const currentBookingsRef = useRef([]);
    const [categoryFilters, setCategoryFilters] = useState({
        showOnlyWithRides: false,
        searchFrom: '',
        searchTo: '',
        sortBy: 'name', // 'name', 'rides', 'bookings', 'revenue'
        sortOrder: 'asc' // 'asc', 'desc'
    });
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [rideFilters, setRideFilters] = useState({
        searchFrom: '',
        searchTo: '',
        showOnlyActive: false,
        sortBy: 'departure', // 'departure', 'price', 'seats', 'bookings'
        sortOrder: 'asc' // 'asc', 'desc'
    });
    const [filteredRides, setFilteredRides] = useState([]);
    const [selectedCategoryRides, setSelectedCategoryRides] = useState([]);
    const [showCategoryRides, setShowCategoryRides] = useState(false);
    const [selectedCategoryForRides, setSelectedCategoryForRides] = useState(null);
    const [loadingCategoryRides, setLoadingCategoryRides] = useState(false);
    const [categoryRidesFilters, setCategoryRidesFilters] = useState({
        showOnlyActive: false,
        sortBy: 'departure', // 'departure', 'price', 'seats', 'booked_seats'
        sortOrder: 'asc', // 'asc', 'desc'
        minPrice: '',
        maxPrice: '',
        minSeats: '',
        maxSeats: ''
    });
    const [filteredCategoryRides, setFilteredCategoryRides] = useState([]);
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

    // Auto-refresh data every 30 seconds when logged in
    useEffect(() => {
        if (!isLoggedIn || !initialLoadComplete) return;

        const interval = setInterval(() => {
            // Only refresh if not currently loading
            if (!loading) {
                fetchData();
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [isLoggedIn, loading, initialLoadComplete]);

    // Update filtered categories when data or filters change
    useEffect(() => {
        if (categories.length > 0 && agencyRides.length >= 0) {
            const categoriesWithStats = calculateCategoryStats(categories, agencyRides, currentBookingsRef.current);
            const filtered = applyCategoryFilters(categoriesWithStats);
            setFilteredCategories(filtered);
        }
    }, [categories, agencyRides, currentBookingsRef.current, categoryFilters]);

    // Update filtered rides when data or filters change
    useEffect(() => {
        if (agencyRides.length >= 0) {
            const filtered = applyRideFilters(agencyRides);
            setFilteredRides(filtered);
        }
    }, [agencyRides, rideFilters]);

    // Update filtered category rides when data or filters change
    useEffect(() => {
        if (selectedCategoryRides.length >= 0) {
            const filtered = applyCategoryRidesFilters(selectedCategoryRides);
            setFilteredCategoryRides(filtered);
        }
    }, [selectedCategoryRides, categoryRidesFilters]);

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

            // Fetch bookings with better error handling
            let currentBookings = [];
            try {
                const bookingsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                currentBookings = bookingsResponse.data;
                setBookings(currentBookings);
                currentBookingsRef.current = currentBookings;
            } catch (error) {
                console.log('Bookings endpoint error:', error.message);
                // Use the ref data if available, otherwise use state
                currentBookings = currentBookingsRef.current.length > 0 ? currentBookingsRef.current : bookings;
            }

            // Filter rides to only include those belonging to the current agency
            const currentAgencyId = currentAgency?.id;
            const agencyRides = ridesResponse.data.filter(ride =>
                ride.agencyId && ride.agencyId._id === currentAgencyId
            );
            setAgencyRides(agencyRides);

            // Calculate stats based on agency rides only
            const totalRides = agencyRides.length;
            const totalCategories = uniqueCategories.length;

            // Calculate bookings for agency rides only
            const agencyRideIds = agencyRides.map(ride => ride._id);
            const agencyBookings = currentBookings.filter(booking =>
                agencyRideIds.includes(booking.rideId || booking.ride?._id)
            );
            const totalBookings = agencyBookings.length;

            console.log('Bookings Debug:', {
                totalBookingsInDB: currentBookings.length,
                agencyRideIds: agencyRideIds,
                agencyBookings: agencyBookings.length,
                previousBookingCount: previousBookingCount,
                currentBookingsRefLength: currentBookingsRef.current.length,
                bookingsStateLength: bookings.length
            });

            // Only update stats if we have valid data
            if (totalRides >= 0 && totalCategories >= 0 && totalBookings >= 0) {
                const activeRides = agencyRides.filter(ride =>
                    new Date(ride.departure_time) > new Date()
                ).length;
                const totalRevenue = agencyRides.reduce((sum, ride) => sum + (ride.price || 0), 0);
                const averageRating = agencyRides.length > 0
                    ? agencyRides.reduce((sum, ride) => sum + (ride.rating || 0), 0) / agencyRides.length
                    : 0;

                setStats({
                    totalRides,
                    totalCategories,
                    totalBookings,
                    activeRides,
                    totalRevenue,
                    averageRating: Math.round(averageRating * 10) / 10
                });
                setLastUpdated(new Date());

                // Check for new bookings
                if (previousBookingCount > 0 && totalBookings > previousBookingCount) {
                    const newBookings = totalBookings - previousBookingCount;
                    console.log(`🎉 ${newBookings} new booking(s) detected! Total bookings: ${totalBookings}`);
                    setHasNewBookings(true);
                    // You could add a toast notification here if you have a notification system
                }
                setPreviousBookingCount(totalBookings);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setInitialLoadComplete(true);
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

    const clearNewBookingsIndicator = () => {
        setHasNewBookings(false);
    };

    const fetchCategoryRides = async (category) => {
        setLoadingCategoryRides(true);
        setSelectedCategoryForRides(category);
        setShowCategoryRides(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            // Filter rides for the specific category
            const categoryRides = agencyRides.filter(ride =>
                ride.categoryId && (ride.categoryId._id === category._id || ride.categoryId === category._id)
            );

            // Sort rides by departure time (earliest first)
            const sortedRides = categoryRides.sort((a, b) =>
                new Date(a.departure_time) - new Date(b.departure_time)
            );

            setSelectedCategoryRides(sortedRides);
        } catch (error) {
            console.error('Error fetching category rides:', error);
        } finally {
            setLoadingCategoryRides(false);
        }
    };

    const applyCategoryRidesFilters = (rides) => {
        let filtered = [...rides];

        // Filter by active rides only
        if (categoryRidesFilters.showOnlyActive) {
            filtered = filtered.filter(ride => new Date(ride.departure_time) > new Date());
        }

        // Filter by price range
        if (categoryRidesFilters.minPrice) {
            filtered = filtered.filter(ride => ride.price >= parseFloat(categoryRidesFilters.minPrice));
        }
        if (categoryRidesFilters.maxPrice) {
            filtered = filtered.filter(ride => ride.price <= parseFloat(categoryRidesFilters.maxPrice));
        }

        // Filter by seats range
        if (categoryRidesFilters.minSeats) {
            filtered = filtered.filter(ride => ride.seats >= parseInt(categoryRidesFilters.minSeats));
        }
        if (categoryRidesFilters.maxSeats) {
            filtered = filtered.filter(ride => ride.seats <= parseInt(categoryRidesFilters.maxSeats));
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (categoryRidesFilters.sortBy) {
                case 'price':
                    aValue = a.price || 0;
                    bValue = b.price || 0;
                    break;
                case 'seats':
                    aValue = a.seats || 0;
                    bValue = b.seats || 0;
                    break;
                case 'booked_seats':
                    aValue = a.booked_seats || 0;
                    bValue = b.booked_seats || 0;
                    break;
                case 'departure':
                default:
                    aValue = new Date(a.departure_time);
                    bValue = new Date(b.departure_time);
                    break;
            }

            if (categoryRidesFilters.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    };

    const calculateCategoryStats = (categories, rides, bookings) => {
        return categories.map(category => {
            const categoryRides = rides.filter(ride =>
                ride.categoryId && (ride.categoryId._id === category._id || ride.categoryId === category._id)
            );

            const categoryBookings = bookings.filter(booking => {
                const bookingRide = rides.find(ride => ride._id === (booking.rideId || booking.ride?._id));
                return bookingRide && bookingRide.categoryId &&
                    (bookingRide.categoryId._id === category._id || bookingRide.categoryId === category._id);
            });

            const totalRevenue = categoryRides.reduce((sum, ride) => sum + (ride.price || 0), 0);
            const activeRides = categoryRides.filter(ride => new Date(ride.departure_time) > new Date()).length;

            return {
                ...category,
                rideCount: categoryRides.length,
                bookingCount: categoryBookings.length,
                totalRevenue,
                activeRides,
                avgRevenue: categoryRides.length > 0 ? totalRevenue / categoryRides.length : 0
            };
        });
    };

    const applyCategoryFilters = (categoriesWithStats) => {
        let filtered = [...categoriesWithStats];

        // Filter by search terms (from and to)
        if (categoryFilters.searchFrom || categoryFilters.searchTo) {
            filtered = filtered.filter(category => {
                const fromMatch = !categoryFilters.searchFrom ||
                    category.from.toLowerCase().includes(categoryFilters.searchFrom.toLowerCase());
                const toMatch = !categoryFilters.searchTo ||
                    category.to.toLowerCase().includes(categoryFilters.searchTo.toLowerCase());
                return fromMatch && toMatch;
            });
        }

        // Filter by rides count
        if (categoryFilters.showOnlyWithRides) {
            filtered = filtered.filter(category => category.rideCount > 0);
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (categoryFilters.sortBy) {
                case 'rides':
                    aValue = a.rideCount;
                    bValue = b.rideCount;
                    break;
                case 'bookings':
                    aValue = a.bookingCount;
                    bValue = b.bookingCount;
                    break;
                case 'revenue':
                    aValue = a.totalRevenue;
                    bValue = b.totalRevenue;
                    break;
                case 'name':
                default:
                    aValue = `${a.from} ${a.to}`.toLowerCase();
                    bValue = `${b.from} ${b.to}`.toLowerCase();
                    break;
            }

            if (categoryFilters.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    };

    const applyRideFilters = (rides) => {
        let filtered = [...rides];

        // Filter by search terms (from and to)
        if (rideFilters.searchFrom || rideFilters.searchTo) {
            filtered = filtered.filter(ride => {
                const fromMatch = !rideFilters.searchFrom ||
                    ride.from.toLowerCase().includes(rideFilters.searchFrom.toLowerCase());
                const toMatch = !rideFilters.searchTo ||
                    ride.to.toLowerCase().includes(rideFilters.searchTo.toLowerCase());
                return fromMatch && toMatch;
            });
        }

        // Filter by active rides only
        if (rideFilters.showOnlyActive) {
            filtered = filtered.filter(ride => new Date(ride.departure_time) > new Date());
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (rideFilters.sortBy) {
                case 'price':
                    aValue = a.price || 0;
                    bValue = b.price || 0;
                    break;
                case 'seats':
                    aValue = a.seats || 0;
                    bValue = b.seats || 0;
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

            if (rideFilters.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
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

    // Handle edit form submission
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoggedIn(false);
                return;
            }

            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/rides/${editingRide._id}`, {
                from: formData.from,
                to: formData.to,
                departure_time: formData.departure_time,
                seats: parseInt(formData.seats),
                price: parseFloat(formData.price),
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setEditingRide(null);
            fetchData(); // Refresh ride list
        } catch (error) {
            console.error('Error updating ride:', error);
        }
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

    // Delete a category
    const handleDeleteCategory = async (id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/destinations/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error deleting category:', error);
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
                                        {lastUpdated && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                Last updated: {lastUpdated.toLocaleTimeString()}
                                            </p>
                                        )}
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
                                        onClick={fetchData}
                                        disabled={loading}
                                        className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm font-semibold flex items-center space-x-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>{loading ? 'Updating...' : 'Refresh'}</span>
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
                                        <p className="text-sm font-medium text-gray-600">Your Rides</p>
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

                            <div
                                className="bg-white rounded-2xl card-shadow border border-blue-100 p-6 hover:scale-105 transition-all duration-300 cursor-pointer"
                                onClick={clearNewBookingsIndicator}
                                title={hasNewBookings ? "Click to clear new bookings indicator" : ""}
                            >
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="flex items-center space-x-2">
                                            <p className="text-sm font-medium text-gray-600">Your Bookings</p>
                                            {hasNewBookings && (
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            )}
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {loading ? '...' : stats.totalBookings}
                                        </p>
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
                        {/* <div className="bg-white rounded-2xl card-shadow border border-blue-100 overflow-hidden">
                            {/* Header */}
                        {/* <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-100">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Your Rides</h2>
                                        <p className="text-sm text-gray-600 font-medium mt-1">Manage and track all your transportation services</p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={() => setShowCreateCategoryForm(true)}
                                            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm font-semibold flex items-center space-x-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                            <span>New Route</span>
                                        </button>
                                        <button
                                            onClick={() => setShowCreateRideForm(true)}
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm font-semibold flex items-center space-x-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span>New Ride</span>
                                        </button>
                                        <div className="bg-white px-4 py-2 rounded-xl border border-blue-200 shadow-sm">
                                            <span className="text-sm text-gray-600 font-medium">Your Rides: </span>
                                            <span className="text-lg font-bold text-blue-600">{filteredRides.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                        {/* <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex flex-wrap gap-4 items-center">
                                    {/* Search */}
                        {/* <div className="flex-1 min-w-64">
                                        <div className="flex gap-2 items-end">
                                            <div className="flex-1">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                                                <input
                                                    type="text"
                                                    placeholder="Departure city..."
                                                    value={rideFilters.searchFrom || ''}
                                                    onChange={(e) => setRideFilters(prev => ({ ...prev, searchFrom: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm"
                                                />
                                            </div>
                                            <div className="flex items-center px-2 pb-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                                                <input
                                                    type="text"
                                                    placeholder="Destination city..."
                                                    value={rideFilters.searchTo || ''}
                                                    onChange={(e) => setRideFilters(prev => ({ ...prev, searchTo: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Show only active rides filter */}
                        {/* <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="showOnlyActive"
                                            checked={rideFilters.showOnlyActive}
                                            onChange={(e) => setRideFilters(prev => ({ ...prev, showOnlyActive: e.target.checked }))}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="showOnlyActive" className="text-sm font-medium text-gray-700">
                                            Show only active rides
                                        </label>
                                    </div>

                                    {/* Sort by */}
                        {/* <div className="flex items-center space-x-2">
                                        <label className="text-sm font-medium text-gray-700">Sort by:</label>
                                        <select
                                            value={rideFilters.sortBy}
                                            onChange={(e) => setRideFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 bg-white"
                                        >
                                            <option value="departure">Departure Time</option>
                                            <option value="price">Price</option>
                                            <option value="seats">Available Seats</option>
                                            <option value="bookings">Bookings</option>
                                        </select>
                                    </div>

                                    {/* Sort order */}
                        {/* <div className="flex items-center space-x-2">
                                        <label className="text-sm font-medium text-gray-700">Order:</label>
                                        <select
                                            value={rideFilters.sortOrder}
                                            onChange={(e) => setRideFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 bg-white"
                                        >
                                            <option value="asc">Ascending</option>
                                            <option value="desc">Descending</option>
                                        </select>
                                    </div>

                                    {/* Clear filters */}
                        {/* <button
                                        onClick={() => setRideFilters({
                                            searchFrom: '',
                                            searchTo: '',
                                            showOnlyActive: false,
                                            sortBy: 'departure',
                                            sortOrder: 'asc'
                                        })}
                                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                    >
                                        Clear Filters
                                    </button>

                                    {/* Results count */}
                        {/* <div className="text-sm text-gray-600">
                                        {filteredRides.length} of {agencyRides.length} rides
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                        {/* <div className="p-6">
                                {filteredRides.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredRides.map((ride) => (
                                            <div key={ride._id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {ride.from} → {ride.to}
                                                        </h3>
                                                        <div className="space-y-1 mt-2">
                                                            <div className="flex items-center space-x-2">
                                                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <p className="text-sm font-medium text-gray-700">
                                                                    Departure: {new Date(ride.departure_time).toLocaleDateString()} at {new Date(ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                            {ride.estimatedArrivalTime && (
                                                                <div className="flex items-center space-x-2">
                                                                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    <p className="text-sm font-medium text-gray-700">
                                                                        Arrival: {new Date(ride.estimatedArrivalTime).toLocaleDateString()} at {new Date(ride.estimatedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${new Date(ride.departure_time) > new Date()
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {new Date(ride.departure_time) > new Date() ? 'Active' : 'Past'}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div className="text-center">
                                                        <p className="text-2xl font-bold text-blue-600">${ride.price?.toLocaleString() || 0}</p>
                                                        <p className="text-xs text-gray-500">Price</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-2xl font-bold text-purple-600">{ride.seats - (ride.booked_seats || 0)}</p>
                                                        <p className="text-xs text-gray-500">Available Seats</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-2xl font-bold text-green-600">{ride.booked_seats || 0}</p>
                                                        <p className="text-xs text-gray-500">Booked Seats</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-2xl font-bold text-yellow-600">{ride.seats}</p>
                                                        <p className="text-xs text-gray-500">Total Seats</p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div className="text-sm text-gray-500">
                                                        {ride.licensePlate && `Vehicle: ${ride.licensePlate}`}
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleEdit(ride)}
                                                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(ride._id)}
                                                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors duration-200"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No rides found</h3>
                                        <p className="text-gray-500 mb-4">
                                            {rideFilters.searchFrom || rideFilters.searchTo || rideFilters.showOnlyActive
                                                ? 'Try adjusting your filters or search terms.'
                                                : 'Get started by creating your first ride.'}
                                        </p>
                                        <div className="flex space-x-3 justify-center">
                                            <button
                                                onClick={() => setShowCreateCategoryForm(true)}
                                                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
                                            >
                                                Create Route First
                                            </button>
                                            <button
                                                onClick={() => setShowCreateRideForm(true)}
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
                                            >
                                                Create First Ride
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        </main> */}

                        {/* Categories Section */}
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            <div className="bg-white rounded-2xl card-shadow border border-blue-100 overflow-hidden">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-100">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h2 className="text-xl font-bold gradient-text tracking-tight">Route Categories</h2>
                                            <p className="text-sm text-gray-600 font-medium mt-1">Manage your destination routes and track performance</p>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => setShowCreateCategoryForm(true)}
                                                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm font-semibold flex items-center space-x-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                <span>New Category</span>
                                            </button>
                                            <div className="bg-white px-4 py-2 rounded-xl border border-green-200 shadow-sm">
                                                <span className="text-sm text-gray-600 font-medium">Categories: </span>
                                                <span className="text-lg font-bold text-green-600">{filteredCategories.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                    <div className="flex flex-wrap gap-4 items-center">
                                        {/* Search */}
                                        <div className="flex-1 min-w-64">
                                            <div className="flex gap-2 items-end">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Departure city..."
                                                        value={categoryFilters.searchFrom || ''}
                                                        onChange={(e) => setCategoryFilters(prev => ({ ...prev, searchFrom: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm"
                                                    />
                                                </div>
                                                <div className="flex items-center px-2 pb-2">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Destination city..."
                                                        value={categoryFilters.searchTo || ''}
                                                        onChange={(e) => setCategoryFilters(prev => ({ ...prev, searchTo: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Show only categories with rides */}
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="showOnlyWithRides"
                                                checked={categoryFilters.showOnlyWithRides}
                                                onChange={(e) => setCategoryFilters(prev => ({ ...prev, showOnlyWithRides: e.target.checked }))}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <label htmlFor="showOnlyWithRides" className="text-sm font-medium text-gray-700">
                                                Show only categories with rides
                                            </label>
                                        </div>

                                        {/* Sort by */}
                                        <div className="flex items-center space-x-2">
                                            <label className="text-sm font-medium text-gray-700">Sort by:</label>
                                            <select
                                                value={categoryFilters.sortBy}
                                                onChange={(e) => setCategoryFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-gray-900 bg-white"
                                            >
                                                <option value="name">Name</option>
                                                <option value="rides">Number of Rides</option>
                                                <option value="bookings">Number of Bookings</option>
                                                <option value="revenue">Total Revenue</option>
                                            </select>
                                        </div>

                                        {/* Sort order */}
                                        <div className="flex items-center space-x-2">
                                            <label className="text-sm font-medium text-gray-700">Order:</label>
                                            <select
                                                value={categoryFilters.sortOrder}
                                                onChange={(e) => setCategoryFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-gray-900 bg-white"
                                            >
                                                <option value="asc">Ascending</option>
                                                <option value="desc">Descending</option>
                                            </select>
                                        </div>

                                        {/* Clear filters */}
                                        <button
                                            onClick={() => setCategoryFilters({
                                                searchFrom: '',
                                                searchTo: '',
                                                showOnlyWithRides: false,
                                                sortBy: 'name',
                                                sortOrder: 'asc'
                                            })}
                                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                        >
                                            Clear Filters
                                        </button>

                                        {/* Results count */}
                                        <div className="text-sm text-gray-600">
                                            {filteredCategories.length} of {categories.length} categories
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {filteredCategories.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredCategories.map((category) => (
                                                <div key={category._id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900">
                                                                {category.from} → {category.to}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                {category.description || 'No description available'}
                                                            </p>
                                                        </div>
                                                        <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            {category.rideCount} rides
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3 mb-4">
                                                        {/* Primary Stats Row */}
                                                        <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-700">Total Rides</p>
                                                                    <p className="text-lg font-bold text-green-600">{category.rideCount}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="flex items-center space-x-1">
                                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                                    <span className="text-xs text-gray-600">Total</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Secondary Stats Grid */}
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div className="bg-purple-50 rounded-lg p-3 text-center">
                                                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                    </svg>
                                                                </div>
                                                                <p className="text-lg font-bold text-purple-600">{category.bookingCount}</p>
                                                                <p className="text-xs text-gray-600">Bookings</p>
                                                            </div>

                                                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                                                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                                    </svg>
                                                                </div>
                                                                <p className="text-lg font-bold text-blue-600">${category.totalRevenue?.toLocaleString() || 0}</p>
                                                                <p className="text-xs text-gray-600">Revenue</p>
                                                            </div>

                                                            <div className="bg-orange-50 rounded-lg p-3 text-center">
                                                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                    </svg>
                                                                </div>
                                                                <p className="text-lg font-bold text-orange-600">{category.activeRides}</p>
                                                                <p className="text-xs text-gray-600">Active Now</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <div className="text-sm text-gray-500">
                                                            {category.averageTime && `Avg. Time: ${category.averageTime}h`}
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => fetchCategoryRides(category)}
                                                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                                                            >
                                                                View Rides
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedCategory(category);
                                                                    setShowCreateRideForm(true);
                                                                }}
                                                                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors duration-200"
                                                            >
                                                                Add Ride
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (window.confirm(`Are you sure you want to delete the route "${category.from} → ${category.to}"? This will also delete all rides associated with this route.`)) {
                                                                        handleDeleteCategory(category._id);
                                                                    }
                                                                }}
                                                                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors duration-200"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                                            <p className="text-gray-500 mb-4">
                                                {categoryFilters.searchFrom || categoryFilters.searchTo || categoryFilters.showOnlyWithRides
                                                    ? 'Try adjusting your filters or search terms.'
                                                    : 'Get started by creating your first route category.'}
                                            </p>
                                            <button
                                                onClick={() => setShowCreateCategoryForm(true)}
                                                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
                                            >
                                                Create First Category
                                            </button>
                                        </div>
                                    )}
                                </div>
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
                                        category={selectedCategory}
                                        formData={formData}
                                        setFormData={setFormData}
                                        onRideCreated={() => {
                                            setShowCreateRideForm(false);
                                            fetchData();
                                        }}
                                        onCancel={() => setShowCreateRideForm(false)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {editingRide && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="p-6 border-b border-blue-100">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Edit Ride</h3>
                                        <button
                                            onClick={() => setEditingRide(null)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors duration-300"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <form onSubmit={handleEditSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                                                <input
                                                    type="text"
                                                    value={formData.from}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 cursor-not-allowed"
                                                    readOnly
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Route cannot be changed</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                                                <input
                                                    type="text"
                                                    value={formData.to}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 cursor-not-allowed"
                                                    readOnly
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Route cannot be changed</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={formData.departure_time}
                                                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                                                <input
                                                    type="number"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Seats</label>
                                            <input
                                                type="number"
                                                value={formData.seats}
                                                onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                                required
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setEditingRide(null)}
                                                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
                                            >
                                                Update Ride
                                            </button>
                                        </div>
                                    </form>
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

                    {/* Category Rides Modal */}
                    {showCategoryRides && selectedCategoryForRides && (
                        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="p-6 border-b border-blue-100">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold gradient-text tracking-tight">
                                                Rides for {selectedCategoryForRides.from} → {selectedCategoryForRides.to}
                                            </h3>
                                            <p className="text-sm text-gray-600 font-medium mt-1">
                                                {filteredCategoryRides.length} of {selectedCategoryRides.length} ride(s) found
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowCategoryRides(false);
                                                setSelectedCategoryForRides(null);
                                                setSelectedCategoryRides([]);
                                                setCategoryRidesFilters({
                                                    showOnlyActive: false,
                                                    sortBy: 'departure',
                                                    sortOrder: 'asc',
                                                    minPrice: '',
                                                    maxPrice: '',
                                                    minSeats: '',
                                                    maxSeats: ''
                                                });
                                            }}
                                            className="text-gray-400 hover:text-gray-600 transition-colors duration-300"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                    <div className="flex flex-wrap gap-4 items-center">
                                        {/* Show only active rides */}
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="showOnlyActiveRides"
                                                checked={categoryRidesFilters.showOnlyActive}
                                                onChange={(e) => setCategoryRidesFilters(prev => ({ ...prev, showOnlyActive: e.target.checked }))}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="showOnlyActiveRides" className="text-sm font-medium text-gray-700">
                                                Show only active rides
                                            </label>
                                        </div>

                                        {/* Price range */}
                                        <div className="flex items-center space-x-2">
                                            <label className="text-sm font-medium text-gray-700">Price:</label>
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                value={categoryRidesFilters.minPrice}
                                                onChange={(e) => setCategoryRidesFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                            />
                                            <span className="text-gray-500">-</span>
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                value={categoryRidesFilters.maxPrice}
                                                onChange={(e) => setCategoryRidesFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                            />
                                        </div>

                                        {/* Seats range */}
                                        <div className="flex items-center space-x-2">
                                            <label className="text-sm font-medium text-gray-700">Seats:</label>
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                value={categoryRidesFilters.minSeats}
                                                onChange={(e) => setCategoryRidesFilters(prev => ({ ...prev, minSeats: e.target.value }))}
                                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                            />
                                            <span className="text-gray-500">-</span>
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                value={categoryRidesFilters.maxSeats}
                                                onChange={(e) => setCategoryRidesFilters(prev => ({ ...prev, maxSeats: e.target.value }))}
                                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                            />
                                        </div>

                                        {/* Sort by */}
                                        <div className="flex items-center space-x-2">
                                            <label className="text-sm font-medium text-gray-700">Sort by:</label>
                                            <select
                                                value={categoryRidesFilters.sortBy}
                                                onChange={(e) => setCategoryRidesFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                                className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                            >
                                                <option value="departure">Departure Time</option>
                                                <option value="price">Price</option>
                                                <option value="seats">Total Seats</option>
                                                <option value="booked_seats">Booked Seats</option>
                                            </select>
                                        </div>

                                        {/* Sort order */}
                                        <div className="flex items-center space-x-2">
                                            <label className="text-sm font-medium text-gray-700">Order:</label>
                                            <select
                                                value={categoryRidesFilters.sortOrder}
                                                onChange={(e) => setCategoryRidesFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                                                className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                            >
                                                <option value="asc">Ascending</option>
                                                <option value="desc">Descending</option>
                                            </select>
                                        </div>

                                        {/* Clear filters */}
                                        <button
                                            onClick={() => setCategoryRidesFilters({
                                                showOnlyActive: false,
                                                sortBy: 'departure',
                                                sortOrder: 'asc',
                                                minPrice: '',
                                                maxPrice: '',
                                                minSeats: '',
                                                maxSeats: ''
                                            })}
                                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors duration-200"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {loadingCategoryRides ? (
                                        <div className="text-center py-12">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                            <p className="text-gray-600">Loading rides...</p>
                                        </div>
                                    ) : filteredCategoryRides.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredCategoryRides.map((ride) => {
                                                const departureDate = new Date(ride.departure_time);
                                                const isActive = departureDate > new Date();
                                                const status = isActive ? 'Active' : 'Past';
                                                const statusColor = isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';

                                                return (
                                                    <div key={ride._id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <h4 className="text-lg font-semibold text-gray-900">
                                                                    {ride.from} → {ride.to}
                                                                </h4>
                                                                <div className="mt-4">
                                                                    <div className="flex items-center space-x-6">
                                                                        <div className="text-center">
                                                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-2">
                                                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                </svg>
                                                                            </div>
                                                                            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Departure</div>
                                                                            <div className="text-lg font-bold text-gray-900">
                                                                                {departureDate.toLocaleTimeString('en-US', {
                                                                                    hour: 'numeric',
                                                                                    minute: '2-digit',
                                                                                    hour12: true
                                                                                })}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">
                                                                                {departureDate.toLocaleDateString('en-US', {
                                                                                    weekday: 'short',
                                                                                    month: 'short',
                                                                                    day: 'numeric'
                                                                                })}
                                                                            </div>
                                                                        </div>

                                                                        {ride.estimatedArrivalTime && (
                                                                            <>
                                                                                <div className="flex flex-col items-center">
                                                                                    <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-green-500 mb-2"></div>
                                                                                    <div className="text-xs text-gray-400 font-medium">Journey</div>
                                                                                </div>

                                                                                <div className="text-center">
                                                                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-2">
                                                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                        </svg>
                                                                                    </div>
                                                                                    <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Arrival</div>
                                                                                    <div className="text-lg font-bold text-gray-900">
                                                                                        {new Date(ride.estimatedArrivalTime).toLocaleTimeString('en-US', {
                                                                                            hour: 'numeric',
                                                                                            minute: '2-digit',
                                                                                            hour12: true
                                                                                        })}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500">
                                                                                        {new Date(ride.estimatedArrivalTime).toLocaleDateString('en-US', {
                                                                                            weekday: 'short',
                                                                                            month: 'short',
                                                                                            day: 'numeric'
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                                                {status}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold text-blue-600">${ride.price?.toLocaleString() || 0}</p>
                                                                <p className="text-xs text-gray-500">Price</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold text-purple-600">{ride.seats - (ride.booked_seats || 0)}</p>
                                                                <p className="text-xs text-gray-500">Available Seats</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold text-green-600">{ride.booked_seats || 0}</p>
                                                                <p className="text-xs text-gray-500">Booked Seats</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold text-yellow-600">{ride.seats}</p>
                                                                <p className="text-xs text-gray-500">Total Seats</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-center">
                                                            <div className="text-sm text-gray-500">
                                                                {ride.licensePlate && `Vehicle: ${ride.licensePlate}`}
                                                            </div>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => {
                                                                        handleEdit(ride);
                                                                        setShowCategoryRides(false);
                                                                    }}
                                                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (window.confirm('Are you sure you want to delete this ride?')) {
                                                                            handleDelete(ride._id);
                                                                            setShowCategoryRides(false);
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors duration-200"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No rides found</h3>
                                            <p className="text-gray-500 mb-4">
                                                {Object.values(categoryRidesFilters).some(val => val !== false && val !== '' && val !== 'departure' && val !== 'asc')
                                                    ? 'Try adjusting your filters.'
                                                    : 'This category doesn\'t have any rides yet. Create the first ride for this route.'}
                                            </p>
                                            {!Object.values(categoryRidesFilters).some(val => val !== false && val !== '' && val !== 'departure' && val !== 'asc') && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedCategory(selectedCategoryForRides);
                                                        setShowCreateRideForm(true);
                                                        setShowCategoryRides(false);
                                                    }}
                                                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
                                                >
                                                    Create First Ride
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
