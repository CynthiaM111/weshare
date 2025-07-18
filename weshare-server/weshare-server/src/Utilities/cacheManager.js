const redisClient = require('./redisClient');

const clearCache = async () => {
    try {
        // Clear multiple cache keys to ensure consistency
        await Promise.all([
            redisClient.del('available_rides'),
            redisClient.del('bookedRides:*'), // Clear user-specific caches
        ]);
        console.log('Cache cleared successfully');
    } catch (error) {
        console.warn('Failed to clear cache:', error.message);
    }
};

module.exports = {
    clearCache
};
