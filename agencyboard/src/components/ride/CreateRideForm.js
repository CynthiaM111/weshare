// src/app/dashboard/CreateRideForm.js
'use client';
import axios from 'axios';

export default function CreateRideForm({
    editingRide,
    setEditingRide,
    fetchRides,
    currentAgency,
    formData,
    setFormData,
    onSuccess
}) {
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            if (editingRide) {
                await axios.put(`http://localhost:5002/api/rides/${editingRide._id}`, {
                    ...formData,
                    seats: Number(formData.seats),
                    price: Number(formData.price) || 0,
                    agencyId: currentAgency.id,
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            } else {
                await axios.post('http://localhost:5002/api/rides', {
                    ...formData,
                    seats: Number(formData.seats),
                    price: Number(formData.price) || 0,
                    agencyId: currentAgency.id,
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }
            fetchRides();
            setFormData({ from: '', to: '', departure_time: '', seats: '', price: '' });
            setEditingRide(null);
            onSuccess();
        } catch (error) {
            console.error('Error creating/updating ride:', error);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
                {editingRide ? 'Edit Ride' : 'Create New Ride'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-600 mb-1">From</label>
                    <input
                        type="text"
                        name="from"
                        value={formData.from}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md text-black"
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-600 mb-1">To</label>
                    <input
                        type="text"
                        name="to"
                        value={formData.to}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md text-black"
                        required
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
                <div className="flex space-x-3">
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex-1"
                    >
                        {editingRide ? 'Update Ride' : 'Create Ride'}
                    </button>
                    {editingRide && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingRide(null);
                                setFormData({ from: '', to: '', departure_time: '', seats: '', price: '' });
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex-1"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}