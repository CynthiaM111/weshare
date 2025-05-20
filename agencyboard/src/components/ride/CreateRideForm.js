// src/app/dashboard/CreateRideForm.js
'use client';
import axios from 'axios';

export default function CreateRideForm({
    category,
    formData,
    setFormData,
    onSuccess,
    editingRide,
    onCancel
}) {
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const rideData = {
                categoryId: category._id,
                departure_time: formData.departure_time,
                seats: Number(formData.seats),
                price: Number(formData.price) || 0,
                licensePlate: formData.licensePlate,
            };

            if (editingRide) {
                // Update existing ride
                await axios.put(
                    `http://localhost:5002/api/rides/${editingRide._id}`,
                    rideData,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
            } else {
                // Create new ride
                await axios.post(
                    'http://localhost:5002/api/rides',
                    rideData,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
            }

            setFormData({
                departure_time: '',
                seats: '',
                price: '',
                licensePlate: '',
            });
            
            await onSuccess();
        } catch (error) {
            console.error('Error saving ride:', error);
        }
    };

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
                        value={formData.departure_time}
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
                        value={formData.seats}
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
                        value={formData.price}
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
                        value={formData.licensePlate}
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