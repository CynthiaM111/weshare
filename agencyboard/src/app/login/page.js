// src/app/login/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
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
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, formData);
            if (res.status === 200) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('role', res.data.role);
                if (res.data.role === 'agency') {
                    router.push('/dashboard');
                } else {
                    setMessage('Login successful! Please use the mobile app.');
                }
            } else {
                setMessage(res.data.error);
            }
        } catch (error) {
            setMessage('Login failed. Please check your credentials.');
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

                {/* Login Card */}
                <div className="bg-white p-8 rounded-3xl card-shadow w-full max-w-md fade-in border border-blue-100">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block mb-6">
                            <h1 className="text-3xl font-bold tracking-wide gradient-text" style={{ fontFamily: 'var(--font-syncopate)' }}>
                                WeShare
                            </h1>
                        </Link>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight">Welcome Back! 👋</h2>
                        <p className="text-gray-600 font-medium">Sign in to your account to continue</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-700 font-semibold mb-3 tracking-tight">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-3 tracking-tight">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300">
                                Forgot password?
                            </Link>
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
                                    Signing in...
                                </div>
                            ) : (
                                'Sign In 🚀'
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

                    {/* Sign Up Link */}
                    <div className="text-center">
                        <p className="text-gray-600 font-medium">
                            Don't have an account?{' '}
                            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-300">
                                Sign up here
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
