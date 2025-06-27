'use client';
import { useState } from 'react';
import { format, isToday, isFuture, isPast } from 'date-fns';
import CreateRideForm from './CreateRideForm';
import axios from 'axios';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function CategoryCard({ category, onEdit, onRideCreated, onRideCancelled }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showRideForm, setShowRideForm] = useState(false);
    const [editingRide, setEditingRide] = useState(null);
    const [rideFormData, setRideFormData] = useState({
        departure_time: '',
        seats: '',
        price: '',
        licensePlate: '',
    });
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [rideToCancel, setRideToCancel] = useState(null);

    const handleRideSuccess = async () => {
        setShowRideForm(false);
        setEditingRide(null);
        if (onRideCreated) {
            await onRideCreated();
        }
        setIsExpanded(true);
    };

    const startEditingRide = (ride) => {
        setRideFormData({
            departure_time: new Date(ride.departure_time).toISOString().slice(0, 16),
            seats: ride.seats,
            price: ride.price,
            licensePlate: ride.licensePlate,
        });
        setEditingRide(ride);
        setShowRideForm(true);
    };

    const handleDeleteRide = async (rideId) => {
        if (!window.confirm('Are you sure you want to delete this ride?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/rides/${rideId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Call the callback to immediately update the parent state
            if (onRideCancelled) {
                onRideCancelled(rideId);
            }

            if (onRideCreated) {
                await onRideCreated();
            }
        } catch (error) {
            console.error('Error deleting ride:', error);
        }
    };

    const handleCancelRide = async (rideId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/rides/${rideId}/cancel-ride`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Call the callback to immediately update the parent state
            if (onRideCancelled) {
                onRideCancelled(rideId);
            }

            if (onRideCreated) {
                await onRideCreated();
            }
            setShowCancelModal(false);
            setRideToCancel(null);
        } catch (error) {
            console.error('Error canceling ride:', error);
        }
    };

    const confirmCancelRide = (ride) => {
        setRideToCancel(ride);
        setShowCancelModal(true);
    };

    const groupRides = (rides) => {
        return rides.reduce((acc, ride) => {
            const rideDate = new Date(ride.departure_time);
            if (isToday(rideDate)) acc.today.push(ride);
            else if (isFuture(rideDate)) acc.future.push(ride);
            else if (isPast(rideDate)) acc.past.push(ride);
            return acc;
        }, { today: [], future: [], past: [] });
    };

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
                        <div key={ride._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex">
                            <div className="w-1 bg-green-500 rounded-full mr-3 self-stretch" />
                            <div className="flex-1 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-black">
                                        {format(new Date(ride.departure_time), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Seats: {ride.seats - ride.booked_seats}/{ride.seats}
                                    </p>
                                    <p className="text-sm text-gray-600">License: {ride.licensePlate}</p>
                                    <p className="text-sm text-gray-600">Price: {ride.price}</p>
                                    <p className="text-sm font-semibold" style={{
                                        color: ride.statusDisplay === 'Full' ? '#FF0000' :
                                            ride.statusDisplay === 'Nearly Full' ? '#FFA500' : '#008000'
                                    }}>
                                        Status: {ride.statusDisplay}
                                    </p>
                                    {ride.booked_seats > 0 && (
                                        <p className="text-sm text-blue-600 font-medium mt-1">
                                            📋 {ride.booked_seats} booking{ride.booked_seats !== 1 ? 's' : ''}
                                        </p>
                                    )}

                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            startEditingRide(ride);
                                        }}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        Edit
                                    </button>
                                    {ride.booked_seats === 0 ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteRide(ride._id);
                                            }}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Delete
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                confirmCancelRide(ride);
                                            }}
                                            className="text-orange-600 hover:text-orange-800"
                                            title={`Cancel ride (${ride.booked_seats} booking${ride.booked_seats !== 1 ? 's' : ''} will be refunded)`}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    );

    return (
        <>
            <div
                className={`p-4 rounded-lg border transition-all duration-200 ${isExpanded
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-400 hover:border-blue-200 hover:bg-blue-50/20'
                    } cursor-pointer`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className={`absolute left-0 top-0 h-full w-1 rounded-l-lg ${isExpanded ? 'bg-blue-600' : 'bg-gray-400'
                    }`} />

                <div className="flex justify-between items-center">
                    <div className="ml-2">
                        <h3 className="font-semibold text-[#4169E1] text-lg">
                            {category.from} → {category.to}
                        </h3>
                        <p className="text-sm text-gray-600">
                            Avg time: {category.averageTime} hours
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`${isExpanded
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-100 text-blue-600'
                            } text-xs font-medium px-2.5 py-0.5 rounded`}>
                            {category.rides?.length || 0} rides
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(category);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            aria-label="Edit category"
                        >
                            <FontAwesomeIcon icon={faEdit} color='gray' />
                        </button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-semibold text-black">
                                {editingRide ? 'Edit Ride' : 'Available Rides'}
                            </h4>
                            {!showRideForm && (
                                <button
                                    onClick={() => setShowRideForm(true)}
                                    className="bg-[#4169E1] text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm font-medium"
                                >
                                    + New Ride
                                </button>
                            )}
                        </div>

                        {showRideForm ? (
                            <CreateRideForm
                                category={category}
                                formData={rideFormData}
                                setFormData={setRideFormData}
                                onSuccess={() => handleRideSuccess()}
                                editingRide={editingRide}
                                onCancel={() => {
                                    setShowRideForm(false);
                                    setEditingRide(null);
                                    setRideFormData({
                                        departure_time: '',
                                        seats: '',
                                        price: '',
                                        licensePlate: '',
                                    });
                                }}
                            />
                        ) : (
                            <div className="space-y-4">
                                {category.rides?.length > 0 ? (
                                    <>
                                        {(() => {
                                            const { today, future, past } = groupRides(category.rides);
                                            return (
                                                <>
                                                    <RidesList rides={today} title="Today's Rides" />
                                                    <RidesList rides={future} title="Future Rides" />
                                                    <RidesList rides={past} title="Past Rides" />
                                                </>
                                            );
                                        })()}
                                    </>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">
                                        No rides available for this category
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Beautiful Cancel Confirmation Modal */}
            {showCancelModal && rideToCancel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
                        <div className="text-center">
                            {/* Warning Icon */}
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
                                <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Cancel Ride Confirmation
                            </h3>

                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                                <div className="text-sm text-orange-800 space-y-2">
                                    <p className="font-medium">⚠️ This action will:</p>
                                    <ul className="list-disc list-inside space-y-1 text-left">
                                        <li>Cancel the ride scheduled for <span className="font-semibold">{format(new Date(rideToCancel.departure_time), 'MMM dd, yyyy HH:mm')}</span></li>
                                        <li>Notify all <span className="font-semibold">{rideToCancel.booked_seats} passenger{rideToCancel.booked_seats !== 1 ? 's' : ''}</span> about the cancellation</li>
                                        <li>Automatically refund all bookings</li>
                                        <li>Remove the ride from the schedule</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <div className="text-sm text-gray-700 space-y-2">
                                    <p className="font-medium">Ride Details:</p>
                                    <div className="grid grid-cols-2 gap-2 text-left">
                                        <span className="text-gray-600">Route:</span>
                                        <span className="font-medium">{rideToCancel.from} → {rideToCancel.to}</span>
                                        <span className="text-gray-600">License:</span>
                                        <span className="font-medium">{rideToCancel.licensePlate}</span>
                                        <span className="text-gray-600">Price:</span>
                                        <span className="font-medium">${rideToCancel.price}</span>
                                        <span className="text-gray-600">Bookings:</span>
                                        <span className="font-medium text-blue-600">{rideToCancel.booked_seats}</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-6">
                                This action cannot be undone. Are you sure you want to proceed?
                            </p>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setRideToCancel(null);
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors duration-200"
                                >
                                    Keep Ride
                                </button>
                                <button
                                    onClick={() => handleCancelRide(rideToCancel._id)}
                                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-colors duration-200"
                                >
                                    Cancel Ride
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}