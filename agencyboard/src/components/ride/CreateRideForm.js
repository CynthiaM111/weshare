// src/app/dashboard/CreateRideForm.js
'use client';
import { useState } from 'react';
import axios from 'axios';

export default function CreateRideForm({
    category,
    formData,
    setFormData,
    onRideCreated,
    editingRide,
    onCancel,
    isDraft = false
}) {
    // If no formData is provided, manage it internally
    const [internalFormData, setInternalFormData] = useState({
        departure_time: '',
        seats: '',
        price: '',
        licensePlate: '',
    });

    const currentFormData = formData || internalFormData;
    const currentSetFormData = setFormData || setInternalFormData;

    const handleChange = (e) => {
        currentSetFormData({ ...currentFormData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Don't proceed if no category is selected
        if (!category) {
            console.error('No category selected');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const rideData = {
                categoryId: category._id,
                departure_time: currentFormData.departure_time,
                seats: Number(currentFormData.seats),
                price: Number(currentFormData.price) || 0,
                licensePlate: currentFormData.licensePlate,
            };

            if (editingRide) {
                // Update existing ride
                await axios.put(
                    `${process.env.NEXT_PUBLIC_API_URL}/rides/${editingRide._id}`,
                    rideData,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
            } else {
                // Create new ride or draft
                const endpoint = isDraft ? '/rides/draft' : '/rides';
                await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
                    rideData,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
            }

            currentSetFormData({
                departure_time: '',
                seats: '',
                price: '',
                licensePlate: '',
            });

            if (onRideCreated) {
                onRideCreated();
            }
        } catch (error) {
            console.error('Error saving ride:', error);
        }
    };

    // Don't render if no category is selected
    if (!category) {
        return (
            <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Route Selected</h3>
                <p className="text-gray-500">Please select a route category first to create a ride.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Route Information Display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Route Information</h3>
                        <p className="text-sm text-gray-600">Fixed route details</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">From</span>
                        </div>
                        <p className="text-lg font-semibold text-blue-900">{category.from}</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">To</span>
                        </div>
                        <p className="text-lg font-semibold text-blue-900">{category.to}</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Travel Time</span>
                        </div>
                        <p className="text-lg font-semibold text-blue-900">{category.averageTime} hours</p>
                    </div>
                </div>
            </div>

            {/* Ride Details Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
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
                            name="departure_time"
                            value={currentFormData.departure_time}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 font-medium"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span>Available Seats</span>
                            </div>
                        </label>
                        <input
                            type="number"
                            name="seats"
                            value={currentFormData.seats}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 font-medium"
                            min="1"
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
                            name="price"
                            value={currentFormData.price}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 font-medium"
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>License Plate</span>
                            </div>
                        </label>
                        <input
                            type="text"
                            name="licensePlate"
                            value={currentFormData.licensePlate}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 font-medium"
                            placeholder="Enter license plate"
                            required
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors duration-200 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold flex items-center space-x-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>{editingRide ? 'Update Ride' : (isDraft ? 'Save as Draft' : 'Create Ride')}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}