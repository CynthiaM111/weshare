import React from 'react';
import CreateRideForm from '@/components/ride/CreateRideForm';
import CreateDestinationCategoryForm from '@/components/destination/CreateDestinationCategoryForm';
import SearchRideForm from '@/components/ride/SearchRideForm';
import RideList from '@/components/ride/RideList';

export default function DashboardModals({
    // Modal states
    showCreateRideForm,
    setShowCreateRideForm,
    showCreateCategoryForm,
    setShowCreateCategoryForm,
    showCategorySelection,
    setShowCategorySelection,
    showCategoryRides,
    setShowCategoryRides,
    showDrafts,
    setShowDrafts,
    isCreatingDraft,
    setIsCreatingDraft,

    // Data and handlers
    selectedCategory,
    setSelectedCategory,
    selectedCategoryRides,
    selectedCategoryForRides,
    loadingCategoryRides,
    filteredCategoryRides,
    categoryRidesFilters,
    setCategoryRidesFilters,
    getRideStatus,
    handleEdit,
    publishDraft,
    handleDelete,

    // Search functionality
    isSearching,
    searchResults,
    hasSearched,
    searchParams,
    setSearchParams,
    handleSearch,
    clearSearch,

    // Form data
    formData,
    setFormData,
    editingRide,
    setEditingRide,
    handleEditSubmit,

    // Category data
    categories,
    categorySearchFilter,
    setCategorySearchFilter,
    getFilteredCategories,

    // Callbacks
    onRideCreated,
    onCategoryCreated,
}) {
    return (
        <>
            {/* Create Ride Form Modal */}
            {showCreateRideForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {isCreatingDraft ? 'Create Draft Ride' : 'Create New Ride'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowCreateRideForm(false);
                                        setSelectedCategory(null);
                                        setIsCreatingDraft(false);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <CreateRideForm
                                category={selectedCategory}
                                formData={formData}
                                setFormData={setFormData}
                                onRideCreated={(newRide) => {
                                    setShowCreateRideForm(false);
                                    setSelectedCategory(null);
                                    setIsCreatingDraft(false);
                                    if (onRideCreated) onRideCreated(newRide);
                                }}
                                onCancel={() => {
                                    setShowCreateRideForm(false);
                                    setSelectedCategory(null);
                                    setIsCreatingDraft(false);
                                }}
                                isDraft={isCreatingDraft}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Create Category Form Modal */}
            {showCreateCategoryForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Create New Route Category</h2>
                                <button
                                    onClick={() => setShowCreateCategoryForm(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <CreateDestinationCategoryForm
                                onCategoryCreated={(newCategory) => {
                                    setShowCreateCategoryForm(false);
                                    if (onCategoryCreated) onCategoryCreated(newCategory);
                                }}
                                onCancel={() => setShowCreateCategoryForm(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Category Selection Modal */}
            {showCategorySelection && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Select Route for Draft Ride</h2>
                                <button
                                    onClick={() => setShowCategorySelection(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Search Filter */}
                            <div className="mb-6">
                                <input
                                    type="text"
                                    placeholder="Search categories..."
                                    value={categorySearchFilter}
                                    onChange={(e) => setCategorySearchFilter(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                                />
                            </div>

                            {/* Categories List */}
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {getFilteredCategories().length > 0 ? (
                                    getFilteredCategories().map((category) => (
                                        <div
                                            key={category._id}
                                            onClick={() => {
                                                setSelectedCategory(category);
                                                setShowCategorySelection(false);
                                                setShowCreateRideForm(true);
                                                setShowDrafts(true);
                                            }}
                                            className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {category.from} → {category.to}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {category.description || 'No description available'}
                                                    </p>
                                                    {category.averageTime && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Average time: {category.averageTime} hours
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                        {category.rideCount || 0} rides
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            {categorySearchFilter ? 'No categories found' : 'No categories available'}
                                        </h3>
                                        <p className="text-gray-500 mb-4">
                                            {categorySearchFilter
                                                ? 'Try adjusting your search terms'
                                                : 'Create your first route category to get started'
                                            }
                                        </p>
                                        {!categorySearchFilter && (
                                            <button
                                                onClick={() => {
                                                    setShowCategorySelection(false);
                                                    setShowCreateCategoryForm(true);
                                                }}
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
                                            >
                                                Create First Category
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Rides Modal */}
            {showCategoryRides && selectedCategoryForRides && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Rides for {selectedCategoryForRides.from} → {selectedCategoryForRides.to}
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {filteredCategoryRides.length} rides found
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCategoryRides(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Filters */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100 shadow-sm">
                                <div className="flex items-center mb-4">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Filter & Sort Rides</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Status</span>
                                            </div>
                                        </label>
                                        <select
                                            value={categoryRidesFilters.statusFilter}
                                            onChange={(e) => setCategoryRidesFilters(prev => ({ ...prev, statusFilter: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900 transition-colors font-medium"
                                        >
                                            <option value="all" className="text-gray-900 font-medium">All Statuses</option>
                                            <option value="available" className="text-gray-900 font-medium">Available</option>
                                            <option value="nearly-full" className="text-gray-900 font-medium">Nearly Full</option>
                                            <option value="full" className="text-gray-900 font-medium">Full</option>
                                        </select>
                                    </div>

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
                                            value={categoryRidesFilters.sortBy}
                                            onChange={(e) => setCategoryRidesFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900 transition-colors font-medium"
                                        >
                                            <option value="departure" className="text-gray-900 font-medium">Departure Time</option>
                                            <option value="price" className="text-gray-900 font-medium">Price</option>
                                            <option value="seats" className="text-gray-900 font-medium">Available Seats</option>
                                            <option value="booked_seats" className="text-gray-900 font-medium">Booked Seats</option>
                                        </select>
                                    </div>

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
                                            value={categoryRidesFilters.sortOrder}
                                            onChange={(e) => setCategoryRidesFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900 transition-colors font-medium"
                                        >
                                            <option value="asc" className="text-gray-900 font-medium">Ascending</option>
                                            <option value="desc" className="text-gray-900 font-medium">Descending</option>
                                        </select>
                                    </div>

                                    <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Options</span>
                                            </div>
                                        </label>
                                        <div className="flex items-center">
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={categoryRidesFilters.showOnlyActive}
                                                    onChange={(e) => setCategoryRidesFilters(prev => ({ ...prev, showOnlyActive: e.target.checked }))}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Active rides only</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-200">
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">{filteredCategoryRides.length}</span> rides match your filters
                                    </div>
                                    <button
                                        onClick={() => setCategoryRidesFilters({
                                            showOnlyActive: false,
                                            sortBy: 'departure',
                                            sortOrder: 'asc',
                                            minPrice: '',
                                            maxPrice: '',
                                            minSeats: '',
                                            maxSeats: '',
                                            statusFilter: 'all'
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

                            {/* Rides List */}
                            {loadingCategoryRides ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading rides...</p>
                                </div>
                            ) : filteredCategoryRides.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {filteredCategoryRides.map((ride) => {
                                        const rideStatus = getRideStatus(ride);

                                        // Calculate arrival time based on departure time and category average time
                                        const calculateArrivalTime = () => {
                                            if (!ride.departure_time || !selectedCategoryForRides?.averageTime) {
                                                return null;
                                            }
                                            try {
                                                const departureDate = new Date(ride.departure_time);
                                                if (isNaN(departureDate.getTime())) return null;
                                                const arrivalDate = new Date(departureDate.getTime() + (selectedCategoryForRides.averageTime * 60 * 60 * 1000));
                                                return arrivalDate;
                                            } catch (error) {
                                                console.error('Error calculating arrival time:', error);
                                                return null;
                                            }
                                        };

                                        // Format date with day and date
                                        const formatDateWithDay = (date) => {
                                            if (!date) return 'N/A';
                                            try {
                                                const dateObj = date instanceof Date ? date : new Date(date);
                                                if (isNaN(dateObj.getTime())) return 'N/A';

                                                const options = {
                                                    weekday: 'short',
                                                    month: 'numeric',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                };
                                                return dateObj.toLocaleDateString('en-US', options);
                                            } catch (error) {
                                                console.error('Error formatting date:', error);
                                                return 'N/A';
                                            }
                                        };

                                        return (
                                            <div key={ride._id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {ride.from} → {ride.to}
                                                        </h3>
                                                        <div className="flex items-center space-x-4 mt-3">
                                                            <div className="flex items-center space-x-2">
                                                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs text-blue-600 font-medium">Departure</span>
                                                                    <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                                                                        {formatDateWithDay(ride.departure_time)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs text-green-600 font-medium">Arrival</span>
                                                                    <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                                                                        {formatDateWithDay(calculateArrivalTime())}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${rideStatus.color}`}>
                                                        {rideStatus.text}
                                                    </div>
                                                </div>

                                                <div className="space-y-3 mb-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">Price:</span>
                                                        <span className="font-semibold text-green-600">${ride.price}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">Seats:</span>
                                                        <span className="font-semibold text-gray-900">
                                                            {ride.seats - (ride.booked_seats || 0)} / {ride.seats}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">Booked:</span>
                                                        <span className="font-semibold text-blue-600">{ride.booked_seats || 0}</span>
                                                    </div>
                                                </div>

                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            // Set form data for editing this specific ride
                                                            setFormData({
                                                                departure_time: ride.departure_time.split('.')[0], // Remove milliseconds for datetime-local input
                                                                seats: ride.seats,
                                                                price: ride.price,
                                                            });
                                                            setEditingRide(ride);
                                                            setShowCategoryRides(false); // Close the category rides modal
                                                        }}
                                                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                                                    >
                                                        Edit Ride
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to delete this ride?')) {
                                                                handleDelete(ride._id);
                                                            }
                                                        }}
                                                        className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors duration-200"
                                                    >
                                                        Delete
                                                    </button>
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
                                    <p className="text-gray-500 mb-4">No rides match your current filters.</p>
                                    <button
                                        onClick={() => setCategoryRidesFilters({
                                            showOnlyActive: false,
                                            sortBy: 'departure',
                                            sortOrder: 'asc',
                                            minPrice: '',
                                            maxPrice: '',
                                            minSeats: '',
                                            maxSeats: '',
                                            statusFilter: 'all'
                                        })}
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Search Ride Form Modal */}
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ display: 'none' }}>
                <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Search Rides</h2>
                            <button
                                onClick={() => {/* Add close handler */ }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <SearchRideForm
                            onSearch={handleSearch}
                            onClear={clearSearch}
                            isSearching={isSearching}
                            searchParams={searchParams}
                            setSearchParams={setSearchParams}
                            searchResults={searchResults}
                            hasSearched={hasSearched}
                        />
                    </div>
                </div>
            </div>

            {/* Edit Ride Modal */}
            {editingRide && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Edit Ride</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {editingRide.from} → {editingRide.to}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setEditingRide(null)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} className="space-y-6">
                                {/* Route Display (Read-only) */}
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Route</p>
                                            <p className="text-lg font-semibold text-blue-900">
                                                {editingRide.from} → {editingRide.to}
                                            </p>
                                            <p className="text-xs text-gray-500">Route is fixed by category</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Editable Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Departure Time</span>
                                            </div>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={formData.departure_time}
                                            onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 font-medium placeholder-gray-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                <span>Total Seats</span>
                                            </div>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.seats}
                                            onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 font-medium placeholder-gray-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                                <span>Price ($)</span>
                                            </div>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 font-medium placeholder-gray-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Current Status</span>
                                            </div>
                                        </label>
                                        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                                            <div className="flex items-center space-x-2">
                                                <div className={`w-3 h-3 rounded-full ${getRideStatus(editingRide).color.replace('bg-', 'bg-').replace('text-white', '')}`}></div>
                                                <span className="text-sm font-medium text-gray-700">{getRideStatus(editingRide).text}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setEditingRide(null)}
                                        className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors duration-200 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
                                    >
                                        Update Ride
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 