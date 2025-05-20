'use client';

import CategoryCard from './CategoryCard';

export default function RideList({ rides, categories, handleEdit, handleDelete, onRideCreated }) {
    // Group rides by category
    const getRidesForCategory = (categoryId) => {
        return rides.filter(ride => {
            // Handle both populated and unpopulated categoryId
            if (typeof ride.categoryId === 'object' && ride.categoryId !== null) {
                return ride.categoryId._id === categoryId;
            }
            return ride.categoryId === categoryId;
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
                <CategoryCard
                    key={category._id}
                    category={category}
                    rides={getRidesForCategory(category._id)}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    onRideCreated={onRideCreated}
                />
            ))}
        </div>
    );
}