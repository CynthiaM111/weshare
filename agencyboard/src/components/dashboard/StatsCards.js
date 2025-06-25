import React from 'react';

export default function StatsCards({ stats, loading, hasNewBookings, clearNewBookingsIndicator }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Your Rides */}
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

            {/* Total Categories */}
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

            {/* Your Bookings */}
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

            {/* Total Revenue */}
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
    );
} 