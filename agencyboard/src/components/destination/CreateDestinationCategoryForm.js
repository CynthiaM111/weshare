'use client';

import { useState } from 'react';
import axios from 'axios';

export default function CreateDestinationCategoryForm({ formData, setFormData, onSuccess, isEditing, categoryId, onCancel }) {
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return; // Prevent multiple submissions
        setIsSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication token not found');
                setIsSubmitting(false);
                return;
            }

            if (isEditing) {
                await axios.put(
                    `${process.env.NEXT_PUBLIC_API_URL}/destinations/${categoryId}`,
                    formData,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
            } else {
                // Check if category already exists
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/destinations`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const existingCategory = response.data.find(
                    cat => cat.from.toLowerCase() === formData.from.toLowerCase() &&
                        cat.to.toLowerCase() === formData.to.toLowerCase()
                );
                if (existingCategory) {
                    setError('A category with this From and To already exists');
                    setIsSubmitting(false);
                    return;
                }

                await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/destinations`,
                    formData,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
            }
            setFormData({
                from: '',
                to: '',
                averageTime: '',
                description: '',
            });
            onSuccess();
        } catch (error) {
            setError(error.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} destination category`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this category?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_URL}/destinations/${categoryId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            onSuccess();
            setFormData({
                from: '',
                to: '',
                averageTime: '',
                description: '',
            });
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to delete destination category');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        From
                    </label>
                    <input
                        type="text"
                        value={formData.from}
                        onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                        className="w-full p-2 border rounded-md text-black"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        To
                    </label>
                    <input
                        type="text"
                        value={formData.to}
                        onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                        className="w-full p-2 border rounded-md text-black"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Average Time (hours)
                    </label>
                    <input
                        type="number"
                        step="0.5"
                        value={formData.averageTime}
                        onChange={(e) => setFormData({ ...formData, averageTime: e.target.value })}
                        className="w-full p-2 border rounded-md text-black"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-2 border rounded-md text-black"
                        rows="3"
                    />
                </div>
            </div>

            {error && (
                <div className="text-red-500 text-sm mt-2">{error}</div>
            )}

            <div className="mt-4 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={() => {
                        
                        onCancel();
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                    Cancel
                </button>
                {isEditing && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                        Delete Category
                    </button>
                )}
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    {isEditing ? 'Update Category' : 'Create Category'}
                </button>
            </div>
        </form>
    );
} 