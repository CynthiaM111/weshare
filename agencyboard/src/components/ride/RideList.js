'use client';

import { FixedSizeList as List } from 'react-window';
import RouteCard from './RouteCard';
import { groupRidesByRouteAndDate } from '../../utils/groupRides';

export default function RideList({
    rides,
    searchResults,
    hasSearched,
    isSearching,
    handleEdit,
    handleDelete,
    clearSearch
}) {
    // Determine which data to display
    const displayData = hasSearched ? searchResults : rides;
    const groupedRides = groupRidesByRouteAndDate(displayData);

    // Virtualized list item renderer
    const Row = ({ index, style }) => (
        <div style={style}>
            <RouteCard
                routeGroup={groupedRides[index]}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
            />
        </div>
    );

    // Threshold for virtualization (adjust based on your needs)
    const shouldVirtualize = groupedRides.length > 20;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
                {hasSearched ? (
                    searchResults.length > 0 ? `Search Results (${searchResults.length})` : 'No matching rides found'
                ) : 'Your Rides'}
            </h2>

            {isSearching ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : hasSearched ? (
                searchResults.length > 0 ? (
                    shouldVirtualize ? (
                        <List
                            height={600}
                            itemCount={groupedRides.length}
                            itemSize={150} // Adjust based on your card height
                            width="100%"
                        >
                            {Row}
                        </List>
                    ) : (
                        <div className="space-y-4">
                            {groupedRides.map((routeGroup) => (
                                <RouteCard
                                    key={`${routeGroup.from}-${routeGroup.to}-${routeGroup.date}`}
                                    routeGroup={routeGroup}
                                    handleEdit={handleEdit}
                                    handleDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No rides match your search criteria</p>
                        <button
                            onClick={clearSearch}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Clear search and show all rides
                        </button>
                    </div>
                )
            ) : rides.length === 0 ? (
                <p className="text-gray-500">No rides available. Create your first ride!</p>
            ) : shouldVirtualize ? (
                <List
                    height={600}
                    itemCount={groupedRides.length}
                    itemSize={150}
                    width="100%"
                >
                    {Row}
                </List>
            ) : (
                <div className="space-y-4">
                    {groupedRides.map((routeGroup) => (
                        <RouteCard
                            key={`${routeGroup.from}-${routeGroup.to}-${routeGroup.date}`}
                            routeGroup={routeGroup}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}