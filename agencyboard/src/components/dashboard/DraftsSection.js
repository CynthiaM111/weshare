import React, { useState } from 'react';

export default function DraftsSection({
    drafts,
    loading,
    handleCreateDraft,
    scrollToDrafts,
    handleEdit,
    publishDraft,
    handleDelete,
}) {
    const [showAllDrafts, setShowAllDrafts] = useState(false);

    // Show first 4 drafts initially, or all if showAllDrafts is true
    const displayedDrafts = showAllDrafts
        ? drafts
        : drafts.slice(0, 4);

    return (
        <div className="bg-white rounded-2xl card-shadow border border-blue-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-100">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold gradient-text tracking-tight">Draft Rides</h2>
                        <p className="text-sm text-gray-600 font-medium mt-1">Manage your unpublished rides that aren't visible to passengers yet</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleCreateDraft}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm font-semibold flex items-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>New Draft</span>
                        </button>
                        <div className="bg-white px-4 py-2 rounded-xl border border-orange-200 shadow-sm">
                            <span className="text-sm text-gray-600 font-medium">Drafts: </span>
                            <span className="text-lg font-bold text-orange-600">{drafts.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {displayedDrafts.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {displayedDrafts.map((draft) => (
                                <div key={draft.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {draft.from} → {draft.to}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {draft.description || 'No description available'}
                                            </p>
                                        </div>
                                        <div className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                            Draft
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Departure:</span>
                                            <span className="font-semibold text-gray-900">
                                                {new Date(draft.departure_time).toLocaleDateString()} at {new Date(draft.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Seats:</span>
                                            <span className="font-semibold text-gray-900">{draft.seats}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Price:</span>
                                            <span className="font-semibold text-green-600">${draft.price?.toLocaleString() || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Vehicle:</span>
                                            <span className="font-semibold text-gray-900">{draft.licensePlate}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Created:</span>
                                            <span className="font-semibold text-gray-900">{new Date(draft.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => publishDraft(draft.id)}
                                            className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors duration-200"
                                        >
                                            Publish
                                        </button>
                                        <button
                                            onClick={() => handleEdit(draft)}
                                            className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this draft?')) {
                                                    handleDelete(draft.id);
                                                }
                                            }}
                                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors duration-200"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* View All Button */}
                        {drafts.length > 4 && (
                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => setShowAllDrafts(!showAllDrafts)}
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold flex items-center space-x-2 mx-auto"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAllDrafts ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                                    </svg>
                                    <span>{showAllDrafts ? 'Show Less' : `View All ${drafts.length} Drafts`}</span>
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts found</h3>
                        <p className="text-gray-500 mb-4">Create your first draft ride to get started.</p>
                        <button
                            onClick={handleCreateDraft}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
                        >
                            Create First Draft
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
} 