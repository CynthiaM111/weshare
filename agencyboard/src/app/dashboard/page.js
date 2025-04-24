// src/app/dashboard/page.js
'use client'; // Enable client-side features since we use hooks

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import CreateRideForm from '@/components/ride/CreateRideForm';
import SearchRideForm from '@/components/ride/SearchRideForm';
import RideList from '@/components/ride/RideList';

export default function Dashboard() {
    const [rides, setRides] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingRide, setEditingRide] = useState(null);
    const [currentAgency, setCurrentAgency] = useState(null);
    const [showCreateRideForm, setShowCreateRideForm] = useState(false);
    const [formData, setFormData] = useState({
        from: '',
        to: '',
        departure_time: '',
        seats: '',
        agencyId: '',
        price: '',
    });
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchParams, setSearchParams] = useState({
        from: '',
        to: '',
        exact_match: false,
    });
    const router = useRouter();

    // Check auth status and fetch rides on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }
            const response = await axios.get('http://localhost:5002/api/auth/status', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data.isAuthenticated && response.data.role === 'agency') {
                setIsLoggedIn(true);
                setCurrentAgency({
                    id: response.data.userId,
                    email: response.data.email,
                    name: response.data.name,
                });
                fetchRides();
            } else {
                setIsLoggedIn(false);
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            setIsLoggedIn(false);
        } finally {
            setLoading(false);
        }
    };

    const fetchRides = async () => {
        try {
            const response = await axios.get('http://localhost:5002/api/rides');
            setRides(response.data);
        } catch (error) {
            console.error('Error fetching rides:', error);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchParams.from || !searchParams.to) return;

        setIsSearching(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5002/api/rides/search', {
                params: {
                    from: searchParams.from,
                    to: searchParams.to,
                    exact_match: searchParams.exact_match
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setSearchResults(response.data);
            setHasSearched(true);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchResults([]);
        setSearchParams({ from: '', to: '', exact_match: false });
        setHasSearched(false);
    };

    const handleEdit = (ride) => {
        setEditingRide(ride);
        setFormData({
            from: ride.from,
            to: ride.to,
            departure_time: ride.departure_time.split('.')[0], // Remove milliseconds for datetime-local input
            seats: ride.seats,
            price: ride.price,
        });
    };

    // Delete a ride
    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }
            await axios.delete(`http://localhost:5002/api/rides/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            fetchRides(); // Refresh ride list
        } catch (error) {
            console.error('Error deleting ride:', error);
        }
    };

    const handleLogout = () => {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            setIsLoggedIn(false);
            setRides([]);
            router.push('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <>
            {!isLoggedIn ? (
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                        <h1 className="text-4xl font-bold text-indigo-600 mb-6">Agency Portal</h1>
                        <p className="text-gray-600 mb-8">Manage your transportation services</p>
                        <div className="space-y-4">
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition duration-200"
                            >
                                Agency Login
                            </button>
                            <button
                                onClick={() => router.push('/signup')}
                                className="w-full border-2 border-indigo-600 text-indigo-600 py-3 px-4 rounded-lg font-medium hover:bg-indigo-50 transition duration-200"
                            >
                                Create Agency Account
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="min-h-screen bg-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">
                                Ride Management Dashboard
                            </h1>
                            {/* {currentAgency && (
                                <p className="text-gray-500 text-lg mr-auto ml-4">Welcome, {currentAgency.name}</p>
                            )} */}
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                            >
                                Logout
                            </button>
                        </div>

                    {/* Search Form */}
                    <SearchRideForm
                        searchParams={searchParams}
                        setSearchParams={setSearchParams}
                        handleSearch={handleSearch}
                        clearSearch={clearSearch}
                        isSearching={isSearching}
                        hasSearched={hasSearched}
                    />

                        {/* Create Ride Button Top Right */}
                        <div className="flex justify-end mb-4">
                            {!showCreateRideForm && !editingRide ? (
                                <button
                                    onClick={() => setShowCreateRideForm(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    + Create New Ride
                                </button>
                            ) : null}
                        </div>

                        {/* Conditional Create Form */}
                        {showCreateRideForm || editingRide ? (
                            <div className="mb-6">
                                <CreateRideForm
                                    editingRide={editingRide}
                                    setEditingRide={setEditingRide}
                                    fetchRides={fetchRides}
                                    currentAgency={currentAgency}
                                    formData={formData}
                                    setFormData={setFormData}
                                    onSuccess={() => {
                                        setShowCreateRideForm(false);
                                        setEditingRide(null);
                                    }}
                                />
                            </div>
                        ) : null}

                        {/* Ride List Section */}
                        <RideList
                            rides={rides}
                            searchResults={searchResults}
                            hasSearched={hasSearched}
                            isSearching={isSearching}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                        clearSearch={clearSearch}
                    />  
                </div>
            )}
        </>
    );
}
