// src/utils/groupRides.js
export function groupRidesByRouteAndDate(rides) {
    const grouped = {};

    rides.forEach(ride => {
        const date = new Date(ride.departure_time);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const routeKey = `${ride.from}-${ride.to}-${dateKey}`;

        if (!grouped[routeKey]) {
            grouped[routeKey] = {
                from: ride.from,
                to: ride.to,
                date: dateKey,
                displayDate: date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                rides: []
            };
        }
        grouped[routeKey].rides.push(ride);
    });

    return Object.values(grouped);
}