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
    onCancel
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
                // Create new ride
                await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/rides`,
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
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Create New Ride
                </h2>
                <p className="text-gray-500">Please select a category first.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
                {editingRide ? 'Edit Ride' : 'Create New Ride'} for {category.from} → {category.to}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-600 mb-1">From</label>
                    <input
                        type="text"
                        value={category.from}
                        className="w-full p-2 border rounded-md text-black bg-gray-100"
                        readOnly
                    />
                </div>
                <div>
                    <label className="block text-gray-600 mb-1">To</label>
                    <input
                        type="text"
                        value={category.to}
                        className="w-full p-2 border rounded-md text-black bg-gray-100"
                        readOnly
                    />
                </div>
                <div>
                    <label className="block text-gray-600 mb-1">Average Travel Time</label>
                    <input
                        type="text"
                        value={`${category.averageTime} hours`}
                        className="w-full p-2 border rounded-md text-black bg-gray-100"
                        readOnly
                    />
                </div>
                <div>
                    <label className="block text-gray-600 mb-1 text-black">Departure Time</label>
                    <input
                        type="datetime-local"
                        name="departure_time"
                        value={currentFormData.departure_time}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md text-black"
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-600 mb-1">Available Seats</label>
                    <input
                        type="number"
                        name="seats"
                        value={currentFormData.seats}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md text-black"
                        min="1"
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-600 mb-1">Price ($)</label>
                    <input
                        type="number"
                        name="price"
                        value={currentFormData.price}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md text-black"
                        step="0.01"
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-600 mb-1">License Plate</label>
                    <input
                        type="text"
                        name="licensePlate"
                        value={currentFormData.licensePlate}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md text-black"
                        required
                    />
                </div>
                <div className="flex space-x-3">
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex-1"
                    >
                        {editingRide ? 'Update Ride' : 'Create Ride'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex-1"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}