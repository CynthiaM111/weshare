'use client';
import { useState, useEffect } from 'react';
import { format, isToday, isFuture, isPast, startOfDay } from 'date-fns';
import CreateRideForm from './CreateRideForm';

export default function CategoryCard({ 
    category, 
    rides, 
    handleEdit, 
    handleDelete,
    onRideCreated 
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingRide, setEditingRide] = useState(null);
    const [formData, setFormData] = useState({
        departure_time: '',
        seats: '',
        price: '',
        licensePlate: '',
    });

    const handleCreateSuccess = async () => {
        setShowCreateForm(false);
        setEditingRide(null);
        await onRideCreated();
        setIsExpanded(true);
    };

    const startEditing = (ride) => {
        // Format the date-time for the input field
        const formattedDate = new Date(ride.departure_time)
            .toISOString()
            .slice(0, 16); // Format: "YYYY-MM-DDTHH:mm"

        setFormData({
            departure_time: formattedDate,
            seats: ride.seats,
            price: ride.price,
            licensePlate: ride.licensePlate,
        });
        setEditingRide(ride);
        setShowCreateForm(true);
    };

    // Group rides by timing
    const groupRides = () => {
        return rides.reduce((acc, ride) => {
            const rideDate = new Date(ride.departure_time);
            
            if (isToday(rideDate)) {
                acc.today.push(ride);
            } else if (isFuture(rideDate)) {
                acc.future.push(ride);
            } else if (isPast(rideDate)) {
                acc.past.push(ride);
            }
            
            return acc;
        }, { today: [], future: [], past: [] });
    };

    const { today, future, past } = groupRides();

    // Sort rides by departure time
    const sortedToday = today.sort((a, b) => 
        new Date(a.departure_time) - new Date(b.departure_time)
    );
    const sortedFuture = future.sort((a, b) => 
        new Date(a.departure_time) - new Date(b.departure_time)
    );
    const sortedPast = past.sort((a, b) => 
        new Date(b.departure_time) - new Date(a.departure_time)
    );

    const RidesList = ({ rides, title }) => (
        rides.length > 0 && (
            <div className="mb-4">
                <h5 className="font-medium text-gray-700 mb-2 flex justify-between items-center">
                    {title}
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {rides.length} rides
                    </span>
                </h5>
                <div className="space-y-2">
                    {rides.map((ride) => (
                        <div 
                            key={ride._id} 
                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        {format(new Date(ride.departure_time), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Seats: {ride.seats - ride.booked_seats}/{ride.seats}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        License: {ride.licensePlate}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Price: {ride.price}
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => startEditing(ride)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ride._id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    );

    // Debug log to check rides
    useEffect(() => {
        console.log(`Rides for category ${category._id}:`, rides);
    }, [rides, category]);

    return (
        <div
            className={`p-4 rounded-lg border ${
                isExpanded ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => !showCreateForm && setIsExpanded(!isExpanded)}
        >
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-black">{category.from} → {category.to}</h3>
                    <p className="text-sm text-gray-600">
                        Average time: {category.averageTime} hours
                    </p>
                    <p className="text-sm text-gray-500">{category.description}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {rides.length} rides
                </span>
            </div>

            {isExpanded && (
                <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold text-black">
                            {editingRide ? 'Edit Ride' : 'Available Rides'}
                        </h4>
                        {!showCreateForm && (
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                + New Ride
                            </button>
                        )}
                    </div>

                    {showCreateForm ? (
                        <CreateRideForm
                            category={category}
                            formData={formData}
                            setFormData={setFormData}
                            onSuccess={handleCreateSuccess}
                            editingRide={editingRide}
                            onCancel={() => {
                                setShowCreateForm(false);
                                setEditingRide(null);
                                setFormData({
                                    departure_time: '',
                                    seats: '',
                                    price: '',
                                    licensePlate: '',
                                });
                            }}
                        />
                    ) : (
                        <div className="space-y-4">
                            <RidesList rides={sortedToday} title="Today's Rides" />
                            <RidesList rides={sortedFuture} title="Future Rides" />
                            <RidesList rides={sortedPast} title="Past Rides" />
                            
                            {rides.length === 0 && (
                                <p className="text-gray-500 text-center py-4">
                                    No rides available for this category
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 