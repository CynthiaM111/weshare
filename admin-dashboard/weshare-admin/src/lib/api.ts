export interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'suspended';
    contact_number?: string;
    createdAt?: string;
}

export interface Agency {
    _id: string;
    name: string;
    email: string;
    contact_number: string;
    address?: string;
    role: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface PrivateRide {
    _id: string;
    from: string;
    to: string;
    departure_time: string;
    estimatedArrivalTime: string;
    seats: number;
    booked_seats: number;
    price: number;
    licensePlate: string;
    description?: string;
    status: string;
    isPrivate: boolean;
    driver: {
        _id: string;
        name: string;
        email: string;
        contact_number: string;
        photoUrl?: string;
    };
    bookedBy: Array<{
        userId: {
            _id: string;
            name: string;
            email: string;
            contact_number: string;
            photoUrl?: string;
        };
        checkInStatus: string;
        paymentStatus?: string;
        bookingId: string;
        createdAt: string;
    }>;
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    availableSeats: number;
    occupancyRate: number;
    createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

export const api = {
    async getUsers(): Promise<User[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    window.location.href = '/login';
                    throw new ApiError(401, 'Authentication required');
                }
                throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.users || data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Failed to fetch users');
        }
    },

    async getAgencies(): Promise<Agency[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/agencies`, {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    window.location.href = '/login';
                    throw new ApiError(401, 'Authentication required');
                }
                throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.agencies || data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Failed to fetch agencies');
        }
    },

    async getPrivateRides(): Promise<PrivateRide[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/private-rides`, {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    window.location.href = '/login';
                    throw new ApiError(401, 'Authentication required');
                }
                throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.rides || data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Failed to fetch private rides');
        }
    },

    async updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<User> {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    window.location.href = '/login';
                    throw new ApiError(401, 'Authentication required');
                }
                if (response.status === 403) {
                    const errorData = await response.json();
                    throw new ApiError(403, errorData.error || 'Operation not allowed');
                }
                if (response.status === 404) {
                    throw new ApiError(404, 'User not found');
                }
                throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.user || data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Failed to update user status');
        }
    },

    async deleteUser(userId: string): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    window.location.href = '/login';
                    throw new ApiError(401, 'Authentication required');
                }
                throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Failed to delete user');
        }
    },

    async getSystemStats(): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/stats`, {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    window.location.href = '/login';
                    throw new ApiError(401, 'Authentication required');
                }
                throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'Failed to fetch system stats');
        }
    }
}; 