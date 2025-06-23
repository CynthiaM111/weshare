'use client';

import { useState, useEffect } from 'react';
import CategoryCard from './CategoryCard';
import CreateDestinationCategoryForm from '../destination/CreateDestinationCategoryForm';

export default function RideList({ rides, categories, onRideCreated }) {
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [showAllRides, setShowAllRides] = useState(true);
    const [categoryFormData, setCategoryFormData] = useState({
        from: '',
        to: '',
        averageTime: '',
        description: '',
    });
    const [editingCategoryId, setEditingCategoryId] = useState(null);

    // Filter rides based on user preference
    const filteredRides = showAllRides ? rides : rides.filter(ride => {
        const currentAgencyId = localStorage.getItem('currentAgencyId');
        return ride.agencyId && ride.agencyId._id === currentAgencyId;
    });

    // Group rides by category
    const getRidesForCategory = (categoryId) => {
        return filteredRides.filter(ride => {
            if (typeof ride.categoryId === 'object' && ride.categoryId !== null) {
                return ride.categoryId._id === categoryId;
            }
            return ride.categoryId === categoryId;
        });
    };

    const handleEditCategory = (category) => {
        setCategoryFormData({
            from: category.from,
            to: category.to,
            averageTime: category.averageTime,
            description: category.description,
        });
        setEditingCategoryId(category._id);
        setShowCategoryForm(true);
    };

    const handleCategorySuccess = () => {
        setShowCategoryForm(false);
        setEditingCategoryId(null);
        setCategoryFormData({
            from: '',
            to: '',
            averageTime: '',
            description: '',
        });
        onRideCreated();
    };

    // Disable body scroll when modal is open
    useEffect(() => {
        if (showCategoryForm) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showCategoryForm]);

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[#4169E1]">Manage Categories and Rides</h2>
                <div className="flex items-center space-x-4">
                    {/* Filter Toggle */}
                    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setShowAllRides(true)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showAllRides
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            All Rides
                        </button>
                        <button
                            onClick={() => setShowAllRides(false)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${!showAllRides
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            My Rides
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            setShowCategoryForm(true);
                            setEditingCategoryId(null);
                            setCategoryFormData({
                                from: '',
                                to: '',
                                averageTime: '',
                                description: '',
                            });
                        }}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold flex items-center space-x-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>New Category</span>
                    </button>
                </div>
            </div>

            {showCategoryForm && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
                        <CreateDestinationCategoryForm
                            formData={categoryFormData}
                            setFormData={setCategoryFormData}
                            onSuccess={handleCategorySuccess}
                            isEditing={!!editingCategoryId}
                            categoryId={editingCategoryId}
                            onCancel={() => {
                                setShowCategoryForm(false);
                                setEditingCategoryId(null);
                                setCategoryFormData({
                                    from: '',
                                    to: '',
                                    averageTime: '',
                                    description: '',
                                });
                            }}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(category => (
                    <CategoryCard
                        key={category._id}
                        category={{ ...category, rides: getRidesForCategory(category._id) }}
                        onEdit={() => handleEditCategory(category)}
                        onRideCreated={onRideCreated}
                    />
                ))}
            </div>
        </div>
    );
}