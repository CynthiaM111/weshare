'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        console.log('ProtectedRoute: isLoading =', isLoading, 'user =', user);

        if (!isLoading && !user) {
            console.log('ProtectedRoute: No user found, redirecting to login');
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        console.log('ProtectedRoute: Loading state');
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        console.log('ProtectedRoute: No user, returning null');
        return null; // Will redirect to login
    }

    console.log('ProtectedRoute: User authenticated, rendering children');
    return <>{children}</>;
} 