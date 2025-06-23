'use client';

export default function AnalyticsCard({ title, value, subtitle, icon, trend, trendValue, trendDirection = 'up', className = '' }) {
    const getTrendColor = (direction) => {
        return direction === 'up' ? 'text-green-600' : 'text-red-600';
    };

    const getTrendIcon = (direction) => {
        return direction === 'up' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
        ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
            </svg>
        );
    };

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition-all duration-300 ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center mb-2">
                        {icon && (
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                                {icon}
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-medium text-gray-600">{title}</p>
                            {trend && (
                                <div className={`flex items-center text-xs font-medium ${getTrendColor(trendDirection)}`}>
                                    {getTrendIcon(trendDirection)}
                                    <span className="ml-1">{trendValue}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    );
} 