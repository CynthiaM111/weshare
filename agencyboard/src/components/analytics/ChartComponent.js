'use client';

import { useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    LineController,
    BarController
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    LineController,
    BarController
);

export default function ChartComponent({
    type = 'line',
    data,
    options = {},
    height = '300px',
    className = ''
}) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (chartRef.current) {
            // Destroy existing chart if it exists
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            // Validate data before creating chart
            if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
                console.warn('ChartComponent: Invalid or empty data provided:', data);
                return;
            }

            console.log('ChartComponent: Creating chart with data:', {
                type,
                labelsCount: data.labels.length,
                datasetsCount: data.datasets.length,
                firstDataset: data.datasets[0]
            });

            const ctx = chartRef.current.getContext('2d');

            // Default options
            const defaultOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                family: 'Inter, sans-serif',
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        padding: 12
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                family: 'Inter, sans-serif',
                                size: 11
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                family: 'Inter, sans-serif',
                                size: 11
                            }
                        }
                    }
                }
            };

            try {
                chartInstance.current = new ChartJS(ctx, {
                    type,
                    data,
                    options: { ...defaultOptions, ...options }
                });
                console.log('ChartComponent: Chart created successfully');
            } catch (error) {
                console.error('ChartComponent: Error creating chart:', error);
                console.error('ChartComponent: Chart data:', data);
                console.error('ChartComponent: Chart options:', { ...defaultOptions, ...options });
            }
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data, type, options]);

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-blue-100 p-6 ${className}`}>
            <div style={{ height }}>
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
} 