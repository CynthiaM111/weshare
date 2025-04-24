// src/app/dashboard/SearchRideForm.js
'use client';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function SearchRideForm({
    searchParams,
    setSearchParams,
    handleSearch,
    clearSearch,
    isSearching,
    hasSearched
}) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="text-blue-600">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                </span>
                Search Rides
            </h2>
            <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-gray-600 mb-1 font-bold">From</label>
                        <input
                            type="text"
                            name="from"
                            value={searchParams.from}
                            onChange={(e) => setSearchParams({ ...searchParams, from: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md text-black"
                            placeholder="e.g., Kigali"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 mb-1 font-bold">To</label>
                        <input
                            type="text"
                            name="to"
                            value={searchParams.to}
                            onChange={(e) => setSearchParams({ ...searchParams, to: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md text-black"
                            placeholder="e.g., Huye"
                            required
                        />
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={searchParams.exact_match}
                                onChange={(e) => setSearchParams({ ...searchParams, exact_match: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-600">Exact match</span>
                        </label>
                    </div>
                </div>
                <div className="md:col-span-1 flex items-end justify-end space-x-2">
                    {hasSearched && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                            disabled={isSearching}
                        >
                            Clear
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSearching || !searchParams.from || !searchParams.to}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:font-bold"
                    >
                        {isSearching ? 'Searching...' : 'Search Rides'}
                    </button>
                </div>
            </form>
        </div>
    );
}