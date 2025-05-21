'use client';

import { useState, useEffect } from 'react';
import CategoryCard from './CategoryCard';
import CreateDestinationCategoryForm from '../destination/CreateDestinationCategoryForm';

export default function RideList({ rides, categories, onRideCreated }) {
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [categoryFormData, setCategoryFormData] = useState({
        from: '',
        to: '',
        averageTime: '',
        description: '',
    });
    const [editingCategoryId, setEditingCategoryId] = useState(null);

    // Group rides by category
    const getRidesForCategory = (categoryId) => {
        return rides.filter(ride => {
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
                    className="bg-[#4169E1] text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                    + New Category
                </button>
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