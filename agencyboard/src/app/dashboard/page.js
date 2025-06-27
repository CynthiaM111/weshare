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
import StatsCards from '@/components/dashboard/StatsCards';
import DraftsSection from '@/components/dashboard/DraftsSection';
import CategoriesSection from '@/components/dashboard/CategoriesSection';
import DraftsCTA from '@/components/dashboard/DraftsCTA';
import DashboardModals from '@/components/dashboard/DashboardModals';
import ErrorDisplay from '@/components/ErrorDisplay';
import { handleApiError } from '@/utils/errorHandler';

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
        maxSeats: '',
        statusFilter: 'all' // 'all', 'available', 'nearly-full', 'full'
    });
    const [filteredCategoryRides, setFilteredCategoryRides] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [showDrafts, setShowDrafts] = useState(false);
    const [showCategorySelection, setShowCategorySelection] = useState(false);
    const [isCreatingDraft, setIsCreatingDraft] = useState(false);
    const [categorySearchFilter, setCategorySearchFilter] = useState('');
    const draftsSectionRef = useRef(null);

    // Error handling state
    const [errors, setErrors] = useState({});
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

    // Refetch data when currentAgency changes (handles navigation back from other pages)
    useEffect(() => {
        if (isLoggedIn && currentAgency && !loading) {
            fetchData();
        }
    }, [currentAgency]);

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

    // Handle navigation back to dashboard
    useEffect(() => {
        const handleFocus = () => {
            if (isLoggedIn && currentAgency && !loading) {
                fetchData();
            }
        };

        const handleRouteChange = () => {
            if (isLoggedIn && currentAgency && !loading) {
                fetchData();
            }
        };

        window.addEventListener('focus', handleFocus);
        router.events?.on('routeChangeComplete', handleRouteChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            router.events?.off('routeChangeComplete', handleRouteChange);
        };
    }, [isLoggedIn, currentAgency, loading, router]);

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

            // Ensure currentAgency is available before proceeding
            if (!currentAgency?.id) {
                console.log('Waiting for currentAgency to be set...');
                return;
            }

            // Fetch rides with cache-busting parameter
            const ridesResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/rides`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { _t: Date.now() } // Cache-busting parameter
            });

            // Validate rides data
            if (!Array.isArray(ridesResponse.data)) {
                console.warn('Invalid rides data received, attempting cache refresh...');
                try {
                    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/rides/cache/refresh`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    // Retry fetching data after cache refresh
                    setTimeout(() => {
                        fetchData();
                    }, 1000);
                } catch (cacheError) {
                    console.error('Failed to refresh cache:', cacheError);
                }
                return;
            }

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
            const currentAgencyId = currentAgency.id;
            const agencyRides = ridesResponse.data.filter(ride =>
                ride.agencyId && (ride.agencyId._id === currentAgencyId || ride.agencyId === currentAgencyId)
            );
            setAgencyRides(agencyRides);

            console.log('Data fetch debug:', {
                totalRides: ridesResponse.data.length,
                agencyRides: agencyRides.length,
                currentAgencyId: currentAgencyId,
                categories: uniqueCategories.length
            });

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
            // If there's an error, try refreshing the cache
            if (error.response?.status === 500) {
                console.log('Server error detected, attempting cache refresh...');
                try {
                    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/rides/cache/refresh`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    // Retry fetching data after cache refresh
                    setTimeout(() => {
                        fetchData();
                    }, 1000);
                } catch (cacheError) {
                    console.error('Failed to refresh cache:', cacheError);
                }
            }
        } finally {
            setLoading(false);
            setInitialLoadComplete(true);
        }

        // Fetch drafts as well
        fetchDrafts();
    };

    const fetchDrafts = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/rides/drafts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDrafts(response.data);
        } catch (error) {
            console.error('Error fetching drafts:', error);
        }
    };

    const publishDraft = async (draftId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/rides/${draftId}/publish`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Clear any existing errors for this action
            setErrors(prev => ({ ...prev, publishDraft: null }));

            // Refresh data after publishing
            fetchData();
            fetchDrafts();
        } catch (error) {
            // Use enhanced error handling
            const errorDetails = handleApiError(error);
            setErrors(prev => ({ ...prev, publishDraft: errorDetails }));
        }
    };

    const handleCreateDraft = () => {
        if (categories.length === 0) {
            setErrors(prev => ({
                ...prev,
                createDraft: {
                    userMessage: 'You need to create at least one route category before creating a draft ride.',
                    code: 'MISSING_FIELDS'
                }
            }));
            setShowCreateCategoryForm(true);
            return;
        }
        // Clear any existing errors
        setErrors(prev => ({ ...prev, createDraft: null }));
        setIsCreatingDraft(true);
        setShowCategorySelection(true);
    };

    const handleCategorySelection = (category) => {
        setSelectedCategory(category);
        setShowCategorySelection(false);
        setShowCreateRideForm(true);
        setShowDrafts(true); // Ensure draft mode is enabled
    };

    const getFilteredCategories = () => {
        if (!categorySearchFilter.trim()) {
            return categories;
        }
        const searchTerm = categorySearchFilter.toLowerCase();
        return categories.filter(category =>
            category.from.toLowerCase().includes(searchTerm) ||
            category.to.toLowerCase().includes(searchTerm) ||
            `${category.from} ${category.to}`.toLowerCase().includes(searchTerm)
        );
    };

    const getRideStatus = (ride) => {
        const availableSeats = ride.seats - (ride.booked_seats || 0);
        const occupancyRate = (ride.booked_seats || 0) / ride.seats;

        if (availableSeats === 0) {
            return { status: 'full', color: 'bg-red-500 text-white', text: 'Full' };
        } else if (occupancyRate >= 0.8) {
            return { status: 'nearly-full', color: 'bg-orange-500 text-white', text: 'Nearly Full' };
        } else {
            return { status: 'available', color: 'bg-green-500 text-white', text: 'Available' };
        }
    };

    const scrollToDrafts = () => {
        draftsSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
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

        // Filter by status
        if (categoryRidesFilters.statusFilter !== 'all') {
            filtered = filtered.filter(ride => {
                const rideStatus = getRideStatus(ride);
                return rideStatus.status === categoryRidesFilters.statusFilter;
            });
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

            // Make the API call first
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/rides/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Only remove from local state if the API call succeeds
            setRides(prevRides => prevRides.filter(ride => ride._id !== id));
            setAgencyRides(prevRides => prevRides.filter(ride => ride._id !== id));
            setSelectedCategoryRides(prevRides => prevRides.filter(ride => ride._id !== id));

            // Also remove from drafts if it's a draft
            setDrafts(prevDrafts => prevDrafts.filter(draft => draft._id !== id));

            // Clear any existing errors for this action
            setErrors(prev => ({ ...prev, deleteRide: null }));

            // Refresh data to ensure consistency
            fetchData();

            // Return success
            return { success: true };
        } catch (error) {
            // If deletion failed, don't refresh data since the ride should still be there
            // Return error for modal to handle
            throw error;
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

            // Clear any existing errors for this action
            setErrors(prev => ({ ...prev, deleteCategory: null }));

            fetchData(); // Refresh data
        } catch (error) {
            // Use enhanced error handling
            const errorDetails = handleApiError(error);
            setErrors(prev => ({ ...prev, deleteCategory: errorDetails }));
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
                            <div className="flex justify-between items-center py-6">
                                {/* Left Side - Brand and User Info */}
                                <div className="flex items-center space-x-6">
                                    <h1 className="text-3xl font-bold tracking-wide gradient-text" style={{ fontFamily: 'var(--font-syncopate)' }}>
                                        WeShare
                                    </h1>
                                    <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-5 py-4 border border-blue-200 shadow-sm">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-gray-900">{currentAgency.name}</h2>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                                    <span className="text-xs text-gray-500 font-medium">Online</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side - Actions */}
                                <div className="flex items-center space-x-4">
                                    {/* Last Updated - Hidden on mobile */}
                                    {lastUpdated && (
                                        <div className="hidden md:flex items-center text-xs text-gray-400">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {lastUpdated.toLocaleTimeString()}
                                        </div>
                                    )}

                                    {/* Primary Actions */}
                                    <div className="flex items-center space-x-3">
                                        {/* Analytics Button */}
                                        <button
                                            onClick={() => router.push('/analytics')}
                                            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm font-semibold flex items-center space-x-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <span>Analytics</span>
                                        </button>

                                        {/* History Button */}
                                        <button
                                            onClick={() => router.push('/history')}
                                            className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm font-semibold flex items-center space-x-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>History</span>
                                        </button>

                                        {/* Refresh Button */}
                                        <button
                                            onClick={fetchData}
                                            disabled={loading}
                                            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title="Refresh Data"
                                        >
                                            <svg className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>

                                        {/* Logout Button */}
                                        <button
                                            onClick={handleLogout}
                                            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm font-semibold flex items-center space-x-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Error Display Components */}
                        {errors.deleteCategory && (
                            <ErrorDisplay
                                error={errors.deleteCategory}
                                onDismiss={() => setErrors(prev => ({ ...prev, deleteCategory: null }))}
                                onRetry={() => {
                                    setErrors(prev => ({ ...prev, deleteCategory: null }));
                                    fetchData();
                                }}
                                variant="inline"
                            />
                        )}

                        {errors.publishDraft && (
                            <ErrorDisplay
                                error={errors.publishDraft}
                                onDismiss={() => setErrors(prev => ({ ...prev, publishDraft: null }))}
                                onRetry={() => {
                                    setErrors(prev => ({ ...prev, publishDraft: null }));
                                    fetchData();
                                }}
                                variant="inline"
                            />
                        )}

                        {errors.createDraft && (
                            <ErrorDisplay
                                error={errors.createDraft}
                                onDismiss={() => setErrors(prev => ({ ...prev, createDraft: null }))}
                                variant="inline"
                            />
                        )}

                        {/* Stats Cards */}
                        <StatsCards
                            stats={stats}
                            loading={loading}
                            hasNewBookings={hasNewBookings}
                            clearNewBookingsIndicator={clearNewBookingsIndicator}
                        />

                        {/* Drafts CTA */}
                        <div className="mb-8">
                            <DraftsCTA
                                drafts={drafts}
                                handleCreateDraft={handleCreateDraft}
                                scrollToDrafts={scrollToDrafts}
                            />
                        </div>

                        {/* Categories Section */}
                        <div className="mb-8">
                            <CategoriesSection
                                filteredCategories={filteredCategories}
                                categoryFilters={categoryFilters}
                                setCategoryFilters={setCategoryFilters}
                                handleCategorySelection={handleCategorySelection}
                                fetchCategoryRides={fetchCategoryRides}
                                handleDeleteCategory={handleDeleteCategory}
                                setShowCreateCategoryForm={setShowCreateCategoryForm}
                            />
                        </div>

                        {/* Drafts Section */}
                        <div ref={draftsSectionRef}>
                            <DraftsSection
                                drafts={drafts}
                                loading={loading}
                                handleCreateDraft={handleCreateDraft}
                                scrollToDrafts={scrollToDrafts}
                                handleEdit={handleEdit}
                                publishDraft={publishDraft}
                                handleDelete={handleDelete}
                            />
                        </div>
                    </main>

                    {/* Modals */}
                    <DashboardModals
                        // Modal states
                        showCreateRideForm={showCreateRideForm}
                        setShowCreateRideForm={setShowCreateRideForm}
                        showCreateCategoryForm={showCreateCategoryForm}
                        setShowCreateCategoryForm={setShowCreateCategoryForm}
                        showCategorySelection={showCategorySelection}
                        setShowCategorySelection={setShowCategorySelection}
                        showCategoryRides={showCategoryRides}
                        setShowCategoryRides={setShowCategoryRides}
                        showDrafts={showDrafts}
                        setShowDrafts={setShowDrafts}
                        isCreatingDraft={isCreatingDraft}
                        setIsCreatingDraft={setIsCreatingDraft}

                        // Data and handlers
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        selectedCategoryRides={selectedCategoryRides}
                        selectedCategoryForRides={selectedCategoryForRides}
                        loadingCategoryRides={loadingCategoryRides}
                        filteredCategoryRides={filteredCategoryRides}
                        categoryRidesFilters={categoryRidesFilters}
                        setCategoryRidesFilters={setCategoryRidesFilters}
                        getRideStatus={getRideStatus}
                        handleEdit={handleEdit}
                        publishDraft={publishDraft}
                        handleDelete={handleDelete}

                        // Search functionality
                        isSearching={isSearching}
                        searchResults={searchResults}
                        hasSearched={hasSearched}
                        searchParams={searchParams}
                        setSearchParams={setSearchParams}
                        handleSearch={handleSearch}
                        clearSearch={clearSearch}

                        // Form data
                        formData={formData}
                        setFormData={setFormData}
                        editingRide={editingRide}
                        setEditingRide={setEditingRide}
                        handleEditSubmit={handleEditSubmit}

                        // Category data
                        categories={categories}
                        categorySearchFilter={categorySearchFilter}
                        setCategorySearchFilter={setCategorySearchFilter}
                        getFilteredCategories={getFilteredCategories}

                        // Callbacks
                        onRideCreated={() => {
                            fetchData();
                            fetchDrafts();
                        }}
                        onCategoryCreated={() => {
                            fetchData();
                        }}
                    />
                </div>
            )}
        </>
    );
}
