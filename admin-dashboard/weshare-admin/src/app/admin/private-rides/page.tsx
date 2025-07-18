'use client';

import { useState, useEffect } from 'react';
import { api, PrivateRide, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

interface Filters {
    search: string;
    status: string;
}

export default function PrivateRidesPage() {
    const [rides, setRides] = useState<PrivateRide[]>([]);
    const [allRides, setAllRides] = useState<PrivateRide[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 50,
        total: 0,
        pages: 1
    });
    const [filters, setFilters] = useState<Filters>({
        search: '',
        status: ''
    });
    const { user, logout } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        fetchPrivateRides(1);
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, allRides]);

    const fetchPrivateRides = async (page: number = 1) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/private-rides?page=${page}&limit=50`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    window.location.href = '/login';
                    throw new ApiError(401, 'Authentication required');
                }
                throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setAllRides(data.rides || []);
            setRides(data.rides || []);
            setPagination(data.pagination || {
                page: 1,
                limit: 50,
                total: data.rides?.length || 0,
                pages: 1
            });
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`Error ${err.status}: ${err.message}`);
            } else {
                setError('Failed to fetch private rides. Please try again.');
            }
            console.error('Error fetching private rides:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filteredRides = [...allRides];

        // Search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredRides = filteredRides.filter(ride =>
                (ride.from && ride.from.toLowerCase().includes(searchTerm)) ||
                (ride.to && ride.to.toLowerCase().includes(searchTerm)) ||
                (ride.licensePlate && ride.licensePlate.toLowerCase().includes(searchTerm)) ||
                (ride.description && ride.description.toLowerCase().includes(searchTerm)) ||
                (ride.driver?.name && ride.driver.name.toLowerCase().includes(searchTerm)) ||
                (ride.driver?.email && ride.driver.email.toLowerCase().includes(searchTerm))
            );
        }

        // Status filter
        if (filters.status) {
            filteredRides = filteredRides.filter(ride => ride.status === filters.status);
        }

        setRides(filteredRides);
        setPagination(prev => ({
            ...prev,
            total: filteredRides.length,
            pages: Math.ceil(filteredRides.length / prev.limit)
        }));
    };

    const handleFilterChange = (key: keyof Filters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            status: ''
        });
    };

    const handleNextPage = () => {
        if (pagination.page < pagination.pages) {
            fetchPrivateRides(pagination.page + 1);
        }
    };

    const handlePreviousPage = () => {
        if (pagination.page > 1) {
            fetchPrivateRides(pagination.page - 1);
        }
    };

    const getStatusBadge = (status: string) => {
        const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
        switch (status) {
            case 'active':
                return `${baseClasses} bg-green-100 text-green-800`;
            case 'completed':
                return `${baseClasses} bg-blue-100 text-blue-800`;
            case 'canceled':
                return `${baseClasses} bg-red-100 text-red-800`;
            case 'pending':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    const getCheckInStatusBadge = (status: string) => {
        const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
        switch (status) {
            case 'completed':
                return `${baseClasses} bg-green-100 text-green-800`;
            case 'pending':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'missed':
                return `${baseClasses} bg-red-100 text-red-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading private rides...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Private Rides</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => fetchPrivateRides(1)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow-sm border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">WeShare Admin Dashboard</h1>
                                <p className="text-gray-600">Manage private rides and monitor system activity</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {rides.length} filtered rides
                                </span>
                                <button
                                    onClick={() => fetchPrivateRides(1)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                >
                                    Refresh
                                </button>
                                <button
                                    onClick={logout}
                                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="flex space-x-8">
                            <Link
                                href="/admin"
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${pathname === '/admin'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Users
                            </Link>
                            <Link
                                href="/admin/agencies"
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${pathname === '/admin/agencies'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Agencies
                            </Link>
                            <Link
                                href="/admin/private-rides"
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${pathname === '/admin/private-rides'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Private Rides
                            </Link>
                            <Link
                                href="/admin/settings"
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${pathname === '/admin/settings'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Settings
                            </Link>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Private Rides</p>
                                    <p className="text-2xl font-semibold text-gray-900">{pagination.total}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Active Rides</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {rides.filter(ride => ride.status === 'active').length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {rides.reduce((total, ride) => total + ride.totalBookings, 0)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Pending Bookings</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {rides.reduce((total, ride) => total + ride.pendingBookings, 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className="bg-white rounded-lg shadow mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                        </div>
                        <div className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Search Filter */}
                                <div>
                                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                                        Search
                                    </label>
                                    <input
                                        type="text"
                                        id="search"
                                        placeholder="Search by route, license plate, driver..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        id="status"
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                        <option value="canceled">Canceled</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>

                                {/* Clear Filters */}
                                <div className="flex items-end">
                                    <button
                                        onClick={clearFilters}
                                        className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Private Rides Table */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-medium text-gray-900">Private Rides</h2>
                                <div className="text-sm text-gray-600">
                                    Showing {rides.length} of {pagination.total} rides
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ride ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Driver
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Route
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Departure
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            License Plate
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bookings
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {rides.map((ride) => (
                                        <tr key={ride._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                                {ride._id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <img
                                                            className="h-10 w-10 rounded-full"
                                                            src={ride.driver?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(ride.driver?.name || 'Unknown Driver')}&color=7C3AED&background=EBF4FF`}
                                                            alt={ride.driver?.name || 'Unknown Driver'}
                                                        />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{ride.driver?.name || 'Unknown Driver'}</div>
                                                        <div className="text-sm text-gray-500">{ride.driver?.email || 'No email'}</div>
                                                        <div className="text-sm text-gray-500">{ride.driver?.contact_number || 'No contact'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {ride.from} → {ride.to}
                                                </div>
                                                {ride.description && (
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                                        {ride.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {formatDateTime(ride.departure_time)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    ETA: {formatDateTime(ride.estimatedArrivalTime)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                                    {ride.licensePlate}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-medium">{ride.totalBookings}</span>
                                                        <span className="text-gray-500">/</span>
                                                        <span>{ride.seats}</span>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {ride.completedBookings} completed, {ride.pendingBookings} pending
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {ride.occupancyRate.toFixed(1)}% occupancy
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={getStatusBadge(ride.status)}>
                                                    {ride.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                KES {ride.price}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {pagination.pages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing page {pagination.page} of {pagination.pages}
                                        ({rides.length} of {pagination.total} rides)
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={handlePreviousPage}
                                            disabled={pagination.page <= 1}
                                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-3 py-2 text-sm text-gray-700">
                                            {pagination.page} / {pagination.pages}
                                        </span>
                                        <button
                                            onClick={handleNextPage}
                                            disabled={pagination.page >= pagination.pages}
                                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {rides.length === 0 && (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No private rides found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {filters.search || filters.status
                                        ? 'Try adjusting your filters or clear them to see all rides.'
                                        : 'No private rides have been created yet.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
} 