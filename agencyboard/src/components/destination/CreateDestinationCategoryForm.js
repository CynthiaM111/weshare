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
        <>
            <style jsx>{`
                .gradient-bg {
                    background: linear-gradient(135deg, #007BFF 0%, #00C6FF 100%);
                }
                
                .card-shadow {
                    box-shadow: 0 4px 20px rgba(0, 123, 255, 0.1);
                }
                
                .input-focus {
                    border-color: #007BFF;
                    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
                }
            `}</style>

            <div className="bg-white rounded-2xl card-shadow border border-blue-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-100">
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                        {isEditing ? 'Edit Route Category' : 'Create New Route Category'}
                    </h3>
                    <p className="text-sm text-gray-600 font-medium mt-1">
                        {isEditing ? 'Update your route information' : 'Add a new route for your transportation services'}
                    </p>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 font-semibold mb-3 tracking-tight">
                                From Location <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.from}
                                onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-300"
                                placeholder="Enter departure location"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-3 tracking-tight">
                                To Location <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.to}
                                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-300"
                                placeholder="Enter destination location"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-3 tracking-tight">
                                Average Time (hours) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                value={formData.averageTime}
                                onChange={(e) => setFormData({ ...formData, averageTime: e.target.value })}
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-300"
                                placeholder="e.g., 2.5"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-3 tracking-tight">
                                Description <span className="text-gray-400 text-sm">(optional)</span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-300 resize-none"
                                rows="3"
                                placeholder="Add any additional details about this route..."
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-red-700 font-medium">{error}</span>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                        >
                            Cancel
                        </button>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
                            >
                                Delete Category
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3 gradient-bg text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>{isEditing ? 'Update Category' : 'Create Category'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
} 