'use client';

import { useState } from 'react';
import axios from 'axios';

export default function CreateDestinationCategoryForm({ formData, setFormData, onSuccess }) {
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/destinations`,
                formData,
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
            setError(error.response?.data?.error || 'Failed to create destination category');
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

            <div className="mt-4 flex justify-end">
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    Create Category
                </button>
            </div>
        </form>
    );
} 