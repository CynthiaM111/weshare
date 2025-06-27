'use client';

import { useState } from 'react';
import axios from 'axios';

export default function CreateDestinationCategoryForm({ onCategoryCreated, isEditing, categoryId, onCancel }) {
    const [formData, setFormData] = useState({
        from: '',
        to: '',
        averageTime: '',
        description: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

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
            onCategoryCreated();
        } catch (error) {
            setError(error.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} destination category`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirmation !== 'DELETE') {
            setError('Please type DELETE to confirm deletion');
            return;
        }

        setIsDeleting(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_URL}/destinations/${categoryId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            onCategoryCreated();
            setFormData({
                from: '',
                to: '',
                averageTime: '',
                description: '',
            });
            setShowDeleteModal(false);
            setDeleteConfirmation('');
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to delete destination category');
        } finally {
            setIsDeleting(false);
        }
    };

    const openDeleteModal = () => {
        setShowDeleteModal(true);
        setDeleteConfirmation('');
        setError('');
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeleteConfirmation('');
        setError('');
    };

    return (
        <>
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
                            if (onCancel) {
                                onCancel();
                            }
                        }}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={openDeleteModal}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                        {/* Danger Icon */}
                        <div className="flex items-center justify-center mb-4">
                            <div className="bg-red-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                        </div>

                        {/* Warning Title */}
                        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                            Delete Route Category
                        </h3>

                        {/* Warning Message */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-red-800 mb-1">
                                        This action cannot be undone!
                                    </p>
                                    <p className="text-sm text-red-700">
                                        Deleting this route category will permanently remove:
                                    </p>
                                    <ul className="text-sm text-red-700 mt-2 space-y-1">
                                        <li>• All rides in this category</li>
                                        <li>• All bookings for those rides</li>
                                        <li>• All associated data and history</li>
                                        <li>• Revenue and analytics data</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Confirmation Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type <span className="font-mono bg-gray-100 px-1 rounded">DELETE</span> to confirm:
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="Type DELETE to confirm"
                                autoFocus
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="text-red-500 text-sm mb-4">{error}</div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete Permanently
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 