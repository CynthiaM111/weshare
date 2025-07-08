import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook for managing cost sharing data
 * @param {string} rideId - The ride ID to fetch cost sharing for
 * @param {boolean} enabled - Whether to enable the hook (default: true)
 * @returns {Object} Cost sharing data, loading state, error state, and refetch function
 */
export const useCostSharing = (rideId, enabled = true) => {
    const [costSharing, setCostSharing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCostSharing = async () => {
        if (!rideId || !enabled) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                `${process.env.EXPO_PUBLIC_API_URL}/cost/calculate/${rideId}/database`
            );

            if (response.data.success) {
                setCostSharing(response.data.data.costSharing);
            } else {
                setError('Failed to calculate cost sharing');
            }
        } catch (err) {
            console.error('Cost sharing fetch error:', err);
            setError('Unable to load cost breakdown');
        } finally {
            setLoading(false);
        }
    };

    const refetch = () => {
        fetchCostSharing();
    };

    useEffect(() => {
        if (enabled && rideId) {
            fetchCostSharing();
        }
    }, [rideId, enabled]);

    return {
        costSharing,
        loading,
        error,
        refetch
    };
};

/**
 * Custom hook for calculating cost sharing with custom parameters
 * @param {Object} rideData - Ride data with fuel cost or parameters
 * @param {boolean} enabled - Whether to enable the hook (default: true)
 * @returns {Object} Cost sharing data, loading state, error state, and calculate function
 */
export const useCostSharingCalculation = (rideData, enabled = true) => {
    const [costSharing, setCostSharing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const calculateCostSharing = async (customRideData = null) => {
        const dataToUse = customRideData || rideData;

        if (!dataToUse || !enabled) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/cost/calculate/${dataToUse.rideId}`,
                {
                    fuelCost: dataToUse.fuelCost,
                    fuelParams: dataToUse.fuelParams
                }
            );

            if (response.data.success) {
                setCostSharing(response.data.data.costSharing);
            } else {
                setError('Failed to calculate cost sharing');
            }
        } catch (err) {
            console.error('Cost sharing calculation error:', err);
            setError('Unable to calculate cost breakdown');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (enabled && rideData) {
            calculateCostSharing();
        }
    }, [rideData, enabled]);

    return {
        costSharing,
        loading,
        error,
        calculateCostSharing
    };
};

/**
 * Custom hook for multiple rides cost sharing
 * @param {Array} rides - Array of ride data
 * @param {boolean} enabled - Whether to enable the hook (default: true)
 * @returns {Object} Cost sharing results, loading state, error state, and calculate function
 */
export const useMultipleRidesCostSharing = (rides, enabled = true) => {
    const [costSharingResults, setCostSharingResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const calculateMultipleRides = async (customRides = null) => {
        const ridesToUse = customRides || rides;

        if (!ridesToUse || !Array.isArray(ridesToUse) || ridesToUse.length === 0 || !enabled) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/cost/calculate/multiple`,
                { rides: ridesToUse }
            );

            if (response.data.success) {
                setCostSharingResults(response.data.data);
            } else {
                setError('Failed to calculate cost sharing for multiple rides');
            }
        } catch (err) {
            console.error('Multiple rides cost sharing error:', err);
            setError('Unable to calculate cost breakdown for multiple rides');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (enabled && rides && Array.isArray(rides) && rides.length > 0) {
            calculateMultipleRides();
        }
    }, [rides, enabled]);

    return {
        costSharingResults,
        loading,
        error,
        calculateMultipleRides
    };
};

/**
 * Custom hook for driver contribution calculation
 * @param {string} driverId - Driver ID
 * @param {Date} startDate - Start date for the period
 * @param {Date} endDate - End date for the period
 * @param {boolean} enabled - Whether to enable the hook (default: true)
 * @returns {Object} Driver contribution data, loading state, error state, and calculate function
 */
export const useDriverContribution = (driverId, startDate, endDate, enabled = true) => {
    const [contribution, setContribution] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const calculateDriverContribution = async (customDriverId = null, customStartDate = null, customEndDate = null) => {
        const driverToUse = customDriverId || driverId;
        const startToUse = customStartDate || startDate;
        const endToUse = customEndDate || endDate;

        if (!driverToUse || !startToUse || !endToUse || !enabled) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                `${process.env.EXPO_PUBLIC_API_URL}/cost/driver/${driverToUse}/contribution`,
                {
                    params: {
                        startDate: startToUse.toISOString().split('T')[0],
                        endDate: endToUse.toISOString().split('T')[0]
                    }
                }
            );

            if (response.data.success) {
                setContribution(response.data.data);
            } else {
                setError('Failed to calculate driver contribution');
            }
        } catch (err) {
            console.error('Driver contribution error:', err);
            setError('Unable to calculate driver contribution');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (enabled && driverId && startDate && endDate) {
            calculateDriverContribution();
        }
    }, [driverId, startDate, endDate, enabled]);

    return {
        contribution,
        loading,
        error,
        calculateDriverContribution
    };
}; 