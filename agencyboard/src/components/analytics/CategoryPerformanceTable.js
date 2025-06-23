'use client';

import { useState, useMemo } from 'react';

export default function CategoryPerformanceTable({ categories, bookings }) {
    const [sortBy, setSortBy] = useState('bookings');
    const [sortOrder, setSortOrder] = useState('desc');

    // Calculate performance metrics for each category
    const categoryStats = useMemo(() => {
        return categories.map(category => {
            const categoryBookings = bookings.filter(booking =>
                booking.ride?.categoryId === category._id ||
                booking.ride?.categoryId?._id === category._id
            );

            const totalBookings = categoryBookings.length;
            const completedBookings = categoryBookings.filter(booking =>
                booking.status === 'completed' || booking.checkInStatus === 'completed'
            ).length;
            const completionRate = totalBookings > 0 ? (completedBookings / totalBookings * 100).toFixed(1) : 0;
            const totalRevenue = categoryBookings.reduce((sum, booking) => sum + (booking.ride?.price || 0), 0);

            return {
                ...category,
                totalBookings,
                completedBookings,
                completionRate: parseFloat(completionRate),
                totalRevenue,
                avgRevenue: totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0
            };
        });
    }, [categories, bookings]);

    // Sort categories based on selected criteria
    const sortedCategories = useMemo(() => {
        return [...categoryStats].sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            if (sortBy === 'completionRate' || sortBy === 'avgRevenue') {
                aValue = parseFloat(aValue);
                bValue = parseFloat(bValue);
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }, [categoryStats, sortBy, sortOrder]);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const getSortIcon = (field) => {
        if (sortBy !== field) {
            return (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }
        return sortOrder === 'asc' ? (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    const getPerformanceBadge = (completionRate) => {
        if (completionRate >= 90) {
            return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Excellent</span>;
        } else if (completionRate >= 75) {
            return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Good</span>;
        } else if (completionRate >= 60) {
            return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Fair</span>;
        } else {
            return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Needs Attention</span>;
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900">Category Performance</h3>
                <p className="text-sm text-gray-600 mt-1">Detailed breakdown of route performance</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Route
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('totalBookings')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Total Bookings</span>
                                    {getSortIcon('totalBookings')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('completionRate')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Completion Rate</span>
                                    {getSortIcon('completionRate')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('totalRevenue')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Total Revenue</span>
                                    {getSortIcon('totalRevenue')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('avgRevenue')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Avg Revenue</span>
                                    {getSortIcon('avgRevenue')}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Performance
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedCategories.map((category, index) => (
                            <tr key={category._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {category.from} → {category.to}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {category.averageTime} hours
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{category.totalBookings}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{category.completionRate}%</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">${category.totalRevenue.toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">${category.avgRevenue}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getPerformanceBadge(category.completionRate)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {sortedCategories.length === 0 && (
                <div className="text-center py-8">
                    <div className="text-gray-500">No category data available</div>
                </div>
            )}
        </div>
    );
} 