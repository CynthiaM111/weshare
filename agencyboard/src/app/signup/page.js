// src/app/signup/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function Signup() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'agency', // Default to agency admin only
        contact_number: '',
        address: ''
    });
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, formData);
            if (res.status === 201) {
                setMessage(res.data.message);
                router.push('/login'); // Agency admins go to login
            } else {
                setMessage(res.data.error);
            }
        } catch (error) {
            setMessage('Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap');
                
                :root {
                    --font-syncopate: 'Syncopate', sans-serif;
                    --font-inter: 'Inter', sans-serif;
                }
                
                * {
                    font-family: var(--font-inter);
                }
                
                .gradient-text {
                    background: linear-gradient(135deg, #007BFF 0%, #00C6FF 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .gradient-bg {
                    background: linear-gradient(135deg, #007BFF 0%, #00C6FF 100%);
                }
                
                .light-gradient-bg {
                    background: linear-gradient(135deg, rgba(0, 123, 255, 0.1) 0%, rgba(0, 198, 255, 0.1) 100%);
                }
                
                .card-shadow {
                    box-shadow: 0 4px 20px rgba(0, 123, 255, 0.1);
                }
                
                .soft-shadow {
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
                }
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .fade-in {
                    animation: fadeInUp 0.8s ease-out;
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-16 h-16 bg-blue-300 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-blue-100 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '4s' }}></div>

                {/* Signup Card */}
                <div className="bg-white p-8 rounded-3xl card-shadow w-full max-w-md fade-in border border-blue-100">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block mb-6">
                            <h1 className="text-3xl font-bold tracking-wide gradient-text" style={{ fontFamily: 'var(--font-syncopate)' }}>
                                WeShare
                            </h1>
                        </Link>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight">Agency Registration 🏢</h2>
                        <p className="text-gray-600 font-medium">Create your agency account for the web dashboard</p>
                    </div>

                    {/* User Type Notice */}
                    <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Are you a normal user? 📱</h3>
                        <p className="text-gray-600 mb-4 font-medium">
                            Download our mobile app to book rides and manage your trips on the go!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <a
                                href="#"
                                className="flex items-center justify-center px-4 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300"
                            >
                                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                </svg>
                                App Store
                            </a>
                            <a
                                href="#"
                                className="flex items-center justify-center px-4 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300"
                            >
                                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                                </svg>
                                Google Play
                            </a>
                        </div>
                    </div>

                    {/* Agency Signup Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-700 font-semibold mb-3 tracking-tight">
                                Agency Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="Enter your agency name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-3 tracking-tight">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="Enter your business email"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-3 tracking-tight">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="Create a strong password"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-3 tracking-tight">
                                Contact Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="contact_number"
                                value={formData.contact_number}
                                onChange={handleChange}
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="Enter contact number"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-3 tracking-tight">
                                Business Address <span className="text-gray-400 text-sm">(optional)</span>
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="Enter business address"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 gradient-bg text-white rounded-xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Creating account...
                                </div>
                            ) : (
                                'Create Agency Account ✨'
                            )}
                        </button>

                        {/* Message Display */}
                        {message && (
                            <div className={`p-4 rounded-xl text-center font-medium ${message.includes('successful')
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                {message}
                            </div>
                        )}
                    </form>

                    {/* Divider */}
                    <div className="my-8 flex items-center">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="px-4 text-gray-500 font-medium">or</span>
                        <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    {/* Login Link */}
                    <div className="text-center">
                        <p className="text-gray-600 font-medium">
                            Already have an account?{' '}
                            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-300">
                                Sign in here
                            </Link>
                        </p>
                    </div>

                    {/* Back to Home */}
                    <div className="text-center mt-6">
                        <Link href="/" className="text-gray-500 hover:text-blue-600 font-medium transition-colors duration-300">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

