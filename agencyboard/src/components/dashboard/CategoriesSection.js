import React, { useState } from 'react';

export default function CategoriesSection({
    filteredCategories,
    categoryFilters,
    setCategoryFilters,
    handleCategorySelection,
    fetchCategoryRides,
    handleDeleteCategory,
    setShowCreateCategoryForm,
}) {
    const [showAllCategories, setShowAllCategories] = useState(false);

    // Show first 4 categories initially, or all if showAllCategories is true
    const displayedCategories = showAllCategories
        ? filteredCategories
        : filteredCategories.slice(0, 4);

    return (
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
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-6 border-b border-blue-100">
                <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Filter & Sort Categories</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search From */}
                    <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>From</span>
                            </div>
                        </label>
                        <input
                            type="text"
                            placeholder="Departure city..."
                            value={categoryFilters.searchFrom || ''}
                            onChange={(e) => setCategoryFilters(prev => ({ ...prev, searchFrom: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm transition-colors"
                        />
                    </div>

                    {/* Search To */}
                    <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>To</span>
                            </div>
                        </label>
                        <input
                            type="text"
                            placeholder="Destination city..."
                            value={categoryFilters.searchTo || ''}
                            onChange={(e) => setCategoryFilters(prev => ({ ...prev, searchTo: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm transition-colors"
                        />
                    </div>

                    {/* Sort By */}
                    <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                </svg>
                                <span>Sort By</span>
                            </div>
                        </label>
                        <select
                            value={categoryFilters.sortBy}
                            onChange={(e) => setCategoryFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 bg-white transition-colors font-medium"
                        >
                            <option value="name" className="text-gray-900 font-medium">Name</option>
                            <option value="rides" className="text-gray-900 font-medium">Number of Rides</option>
                            <option value="bookings" className="text-gray-900 font-medium">Number of Bookings</option>
                            <option value="revenue" className="text-gray-900 font-medium">Total Revenue</option>
                        </select>
                    </div>

                    {/* Sort Order */}
                    <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                </svg>
                                <span>Order</span>
                            </div>
                        </label>
                        <select
                            value={categoryFilters.sortOrder}
                            onChange={(e) => setCategoryFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 bg-white transition-colors font-medium"
                        >
                            <option value="asc" className="text-gray-900 font-medium">Ascending</option>
                            <option value="desc" className="text-gray-900 font-medium">Descending</option>
                        </select>
                    </div>
                </div>

                {/* Options and Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-200">
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                id="showOnlyWithRides"
                                checked={categoryFilters.showOnlyWithRides}
                                onChange={(e) => setCategoryFilters(prev => ({ ...prev, showOnlyWithRides: e.target.checked }))}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 font-medium">Show only categories with rides</span>
                        </label>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{filteredCategories.length}</span> categories match your filters
                        </div>
                        <button
                            onClick={() => setCategoryFilters({
                                searchFrom: '',
                                searchTo: '',
                                showOnlyWithRides: false,
                                sortBy: 'name',
                                sortOrder: 'asc'
                            })}
                            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Reset Filters</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {displayedCategories.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {displayedCategories.map((category) => (
                                <div key={category._id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {category.from} → {category.to}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {category.description || 'No description available'}
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${category.rideCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {category.rideCount} rides
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Total Rides:</span>
                                            <span className="font-semibold text-gray-900">{category.rideCount}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Total Bookings:</span>
                                            <span className="font-semibold text-gray-900">{category.bookingCount}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Total Revenue:</span>
                                            <span className="font-semibold text-green-600">${category.totalRevenue?.toLocaleString() || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Active Rides:</span>
                                            <span className="font-semibold text-gray-900">{category.activeRides}</span>
                                        </div>
                                        {category.averageTime && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Average Time:</span>
                                                <span className="font-semibold text-gray-900">{category.averageTime} hours</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => fetchCategoryRides(category)}
                                            className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                                        >
                                            View Rides
                                        </button>
                                        <button
                                            onClick={() => handleCategorySelection(category)}
                                            className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors duration-200"
                                        >
                                            Add Ride
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Are you sure you want to delete the route "${category.from} → ${category.to}"? This will also delete all rides associated with this route.`)) {
                                                    handleDeleteCategory(category._id);
                                                }
                                            }}
                                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors duration-200"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* View All Button */}
                        {filteredCategories.length > 4 && (
                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => setShowAllCategories(!showAllCategories)}
                                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold flex items-center space-x-2 mx-auto"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAllCategories ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                                    </svg>
                                    <span>{showAllCategories ? 'Show Less' : `View All ${filteredCategories.length} Categories`}</span>
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No route categories found</h3>
                        <p className="text-gray-500 mb-4">You need to create at least one route category before creating a draft ride.</p>
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
    );
} 