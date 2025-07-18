'use client';

import { useState, useEffect } from 'react';
import { api, SystemSettings, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsPage() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        fuelPricePerLiter: '',
        fuelEfficiencyMin: '',
        fuelEfficiencyMax: ''
    });
    const { user, logout } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getSystemSettings();
            setSettings(data);
            setFormData({
                fuelPricePerLiter: data.fuelPricePerLiter.toString(),
                fuelEfficiencyMin: data.fuelEfficiencyMin.toString(),
                fuelEfficiencyMax: data.fuelEfficiencyMax.toString()
            });
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`Error ${err.status}: ${err.message}`);
            } else {
                setError('Failed to fetch system settings. Please try again.');
            }
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError(null);
            setSuccessMessage(null);

            // Validate form data
            const fuelPrice = parseFloat(formData.fuelPricePerLiter);
            const efficiencyMin = parseFloat(formData.fuelEfficiencyMin);
            const efficiencyMax = parseFloat(formData.fuelEfficiencyMax);

            if (isNaN(fuelPrice) || fuelPrice < 0) {
                setError('Fuel price must be a positive number');
                return;
            }

            if (isNaN(efficiencyMin) || efficiencyMin <= 0 || efficiencyMin > 50) {
                setError('Minimum fuel efficiency must be between 0 and 50 L/100km');
                return;
            }

            if (isNaN(efficiencyMax) || efficiencyMax <= 0 || efficiencyMax > 50) {
                setError('Maximum fuel efficiency must be between 0 and 50 L/100km');
                return;
            }

            if (efficiencyMin > efficiencyMax) {
                setError('Minimum fuel efficiency cannot be greater than maximum fuel efficiency');
                return;
            }

            // Update settings
            const updatedSettings = await api.updateSystemSettings({
                fuelPricePerLiter: fuelPrice,
                fuelEfficiencyMin: efficiencyMin,
                fuelEfficiencyMax: efficiencyMax
            });

            setSettings(updatedSettings);
            setSuccessMessage('System settings updated successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Failed to update system settings. Please try again.');
            }
            console.error('Error updating settings:', err);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading system settings...</p>
                </div>
            </div>
        );
    }

    if (error && !settings) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Settings</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={fetchSettings}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow-sm border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">WeShare Admin Dashboard</h1>
                                <p className="text-gray-600">Manage system settings and configuration</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>
                                <button
                                    onClick={logout}
                                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="flex space-x-8">
                            <Link
                                href="/admin"
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${pathname === '/admin'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Users
                            </Link>
                            <Link
                                href="/admin/agencies"
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${pathname === '/admin/agencies'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Agencies
                            </Link>
                            <Link
                                href="/admin/private-rides"
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${pathname === '/admin/private-rides'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Private Rides
                            </Link>
                            <Link
                                href="/admin/settings"
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${pathname === '/admin/settings'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Settings
                            </Link>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">{successMessage}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Settings Form */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">System Settings</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Configure system-wide settings that affect ride pricing and validation
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="px-6 py-6">
                            {/* Fuel Price Settings */}
                            <div className="mb-8">
                                <h3 className="text-md font-medium text-gray-900 mb-4">Fuel Price Settings</h3>

                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label htmlFor="fuelPricePerLiter" className="block text-sm font-medium text-gray-700 mb-2">
                                            Fuel Price per Liter (RWF)
                                        </label>
                                        <input
                                            type="number"
                                            id="fuelPricePerLiter"
                                            value={formData.fuelPricePerLiter}
                                            onChange={(e) => handleInputChange('fuelPricePerLiter', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g., 1700"
                                            step="0.01"
                                            min="0"
                                            required
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            This price will be used for all fuel cost calculations in private rides
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Fuel Efficiency Validation */}
                            <div className="mb-8">
                                <h3 className="text-md font-medium text-gray-900 mb-4">Fuel Efficiency Validation</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="fuelEfficiencyMin" className="block text-sm font-medium text-gray-700 mb-2">
                                            Minimum Fuel Efficiency (L/100km)
                                        </label>
                                        <input
                                            type="number"
                                            id="fuelEfficiencyMin"
                                            value={formData.fuelEfficiencyMin}
                                            onChange={(e) => handleInputChange('fuelEfficiencyMin', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g., 6.0"
                                            step="0.1"
                                            min="0"
                                            max="50"
                                            required
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Minimum allowed fuel efficiency for drivers
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="fuelEfficiencyMax" className="block text-sm font-medium text-gray-700 mb-2">
                                            Maximum Fuel Efficiency (L/100km)
                                        </label>
                                        <input
                                            type="number"
                                            id="fuelEfficiencyMax"
                                            value={formData.fuelEfficiencyMax}
                                            onChange={(e) => handleInputChange('fuelEfficiencyMax', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g., 10.0"
                                            step="0.1"
                                            min="0"
                                            max="50"
                                            required
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Maximum allowed fuel efficiency for drivers
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Current Settings Info */}
                            {settings && (
                                <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Current Settings</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Fuel Price:</span>
                                            <span className="ml-2 font-medium text-gray-800">{settings.fuelPricePerLiter} RWF/L</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Efficiency Range:</span>
                                            <span className="ml-2 font-medium text-gray-800">{settings.fuelEfficiencyMin}-{settings.fuelEfficiencyMax} L/100km</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Last Updated:</span>
                                            <span className="ml-2 font-medium text-gray-800">{formatDate(settings.updatedAt)}</span>
                                        </div>
                                    </div>
                                    {settings.lastUpdatedBy && (
                                        <div className="mt-2 text-sm text-gray-600">
                                            <span>Updated by: {settings.lastUpdatedBy.name} ({settings.lastUpdatedBy.email})</span>
                                        </div>
                                    )}
                                    {!settings.lastUpdatedBy && (
                                        <div className="mt-2 text-sm text-gray-500">
                                            <span>Settings not yet updated by any admin</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                                >
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
} 