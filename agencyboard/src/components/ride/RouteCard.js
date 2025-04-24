// src/app/dashboard/RouteCard.js
'use client';

import { useState } from 'react';

export default function RouteCard({ routeGroup, handleEdit, handleDelete }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="border rounded-md bg-blue-50 mb-4 overflow-hidden">
            <div
                className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div>
                    <h3 className="font-bold text-lg text-black">
                        {routeGroup.from} → {routeGroup.to}
                    </h3>
                    <p className="text-gray-600">{routeGroup.displayDate}</p>
                    <p className="text-sm text-gray-500">
                        {routeGroup.rides.length} {routeGroup.rides.length === 1 ? 'ride' : 'rides'} available
                    </p>
                </div>
                <svg
                    className={`h-5 w-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isExpanded && (
                <div className="border-t">
                    {routeGroup.rides.map((ride) => (
                        <div key={ride._id} className="p-4 hover:bg-gray-50 border-b last:border-b-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-600 text-sm">
                                        Departure: {new Date(ride.departure_time).toLocaleTimeString()}
                                    </p>
                                    <div className="flex space-x-4 mt-2 text-sm text-black">
                                        <span>Seats: {ride.seats}</span>
                                        <span>Price: ${ride.price}</span>
                                        {ride.booked_seats > 0 && (
                                            <span className="text-green-600">
                                                Booked: {ride.booked_seats}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(ride);
                                        }}
                                        className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 text-sm"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(ride._id);
                                        }}
                                        className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}