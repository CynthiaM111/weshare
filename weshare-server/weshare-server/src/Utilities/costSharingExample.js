/**
 * Cost Sharing Calculator Usage Examples
 * Demonstrates how to use the CostSharingCalculator utility
 */

const CostSharingCalculator = require('./costSharingCalculator');
const FuelCostCalculator = require('./fuelCostCalculator');

// Example 1: Basic cost sharing calculation
function basicCostSharingExample() {
    console.log('=== Basic Cost Sharing Calculation ===');

    const rideData = {
        rideId: '507f1f77bcf86cd799439011',
        totalSeats: 4,
        bookedSeats: 1,
        fuelCost: 8000 // 8000 RWF total fuel cost
    };

    try {
        const costSharing = CostSharingCalculator.calculateCostSharing(rideData);
        console.log('Cost Sharing Breakdown:', costSharing);

        // Generate detailed report
        const report = CostSharingCalculator.generateCostSharingReport(costSharing, {
            from: 'Kigali',
            to: 'Butare',
            distance: '135 km'
        });
        console.log('Detailed Report:', report);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Example 2: Cost sharing with fuel calculation
function costSharingWithFuelCalculationExample() {
    console.log('\n=== Cost Sharing with Fuel Calculation ===');

    const rideData = {
        rideId: '507f1f77bcf86cd799439012',
        totalSeats: 6,
        bookedSeats: 2,
        fuelParams: {
            startLat: -1.9441, // Kigali
            startLon: 30.0619,
            endLat: -2.5966,   // Butare
            endLon: 29.7394,
            fuelEfficiency: 7.0, // 7L/100km
            pricePerLiter: 1700  // Rwandan Francs
        }
    };

    try {
        const costSharing = CostSharingCalculator.calculateCostSharing(rideData);
        console.log('Cost Sharing with Calculated Fuel:', costSharing);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Example 3: Multiple rides cost sharing
function multipleRidesCostSharingExample() {
    console.log('\n=== Multiple Rides Cost Sharing ===');

    const rides = [
        {
            rideId: '507f1f77bcf86cd799439013',
            totalSeats: 4,
            bookedSeats: 2,
            fuelCost: 6000
        },
        {
            rideId: '507f1f77bcf86cd799439014',
            totalSeats: 6,
            bookedSeats: 4,
            fuelCost: 12000
        },
        {
            rideId: '507f1f77bcf86cd799439015',
            totalSeats: 3,
            bookedSeats: 0,
            fuelCost: 4500
        }
    ];

    try {
        const costSharingResults = CostSharingCalculator.calculateCostSharingForMultipleRides(rides);
        console.log('Multiple Rides Cost Sharing:', costSharingResults);

        // Calculate totals
        const totals = costSharingResults.reduce((acc, result) => {
            if (!result.error) {
                acc.totalFuelCost += result.totalFuelCost;
                acc.totalDriverShare += result.driverShare;
                acc.totalPassengerShare += result.passengerShare;
                acc.totalRides++;
            }
            return acc;
        }, { totalFuelCost: 0, totalDriverShare: 0, totalPassengerShare: 0, totalRides: 0 });

        console.log('Totals:', totals);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Example 4: Passenger savings calculation
function passengerSavingsExample() {
    console.log('\n=== Passenger Savings Calculation ===');

    const costSharing = {
        rideId: '507f1f77bcf86cd799439016',
        totalFuelCost: 10000,
        driverShare: 2500,
        passengerShare: 7500,
        totalSeats: 4,
        bookedSeats: 1,
        availableSeats: 3,
        perPassengerCost: 2500
    };

    const fullFuelCost = 10000; // Full fuel cost without sharing

    try {
        const savings = CostSharingCalculator.calculatePassengerSavings(costSharing, fullFuelCost);
        console.log('Passenger Savings:', savings);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Example 5: Different seating scenarios
function seatingScenariosExample() {
    console.log('\n=== Different Seating Scenarios ===');

    const scenarios = [
        { name: 'Empty Car', totalSeats: 4, bookedSeats: 0 },
        { name: 'Half Full', totalSeats: 4, bookedSeats: 2 },
        { name: 'Full Car', totalSeats: 4, bookedSeats: 4 },
        { name: 'Large Vehicle', totalSeats: 8, bookedSeats: 3 }
    ];

    const fuelCost = 8000; // Fixed fuel cost for comparison

    scenarios.forEach(scenario => {
        try {
            const costSharing = CostSharingCalculator.calculateCostSharing({
                rideId: `scenario_${scenario.name.replace(/\s+/g, '_').toLowerCase()}`,
                totalSeats: scenario.totalSeats,
                bookedSeats: scenario.bookedSeats,
                fuelCost
            });

            console.log(`${scenario.name}:`);
            console.log(`  - Driver pays: ${costSharing.driverShare} RWF`);
            console.log(`  - Each passenger pays: ${costSharing.perPassengerCost} RWF`);
            console.log(`  - Available seats: ${costSharing.availableSeats}`);
            console.log('');

        } catch (error) {
            console.error(`Error in ${scenario.name}:`, error.message);
        }
    });
}

// Example 6: Validation example
function validationExample() {
    console.log('\n=== Parameter Validation ===');

    const testCases = [
        {
            name: 'Valid Parameters',
            params: {
                rideId: '507f1f77bcf86cd799439017',
                totalSeats: 4,
                bookedSeats: 2,
                fuelCost: 8000
            }
        },
        {
            name: 'Missing Ride ID',
            params: {
                totalSeats: 4,
                bookedSeats: 2,
                fuelCost: 8000
            }
        },
        {
            name: 'Invalid Seats',
            params: {
                rideId: '507f1f77bcf86cd799439018',
                totalSeats: 0,
                bookedSeats: 2,
                fuelCost: 8000
            }
        },
        {
            name: 'Booked Seats > Total Seats',
            params: {
                rideId: '507f1f77bcf86cd799439019',
                totalSeats: 4,
                bookedSeats: 6,
                fuelCost: 8000
            }
        },
        {
            name: 'Negative Fuel Cost',
            params: {
                rideId: '507f1f77bcf86cd799439020',
                totalSeats: 4,
                bookedSeats: 2,
                fuelCost: -1000
            }
        }
    ];

    testCases.forEach(testCase => {
        const validation = CostSharingCalculator.validateCostSharingParams(testCase.params);
        console.log(`${testCase.name}: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
        if (!validation.isValid) {
            console.log(`  Errors: ${validation.errors.join(', ')}`);
        }
    });
}

// Example 7: Driver contribution calculation (simulated)
async function driverContributionExample() {
    console.log('\n=== Driver Contribution Calculation ===');

    try {
        const driverId = '507f1f77bcf86cd799439021';
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');

        // Note: This would require actual database data
        // For demonstration, we'll show the structure
        console.log('Driver Contribution Structure:');
        console.log({
            driverId,
            period: { startDate, endDate },
            totalFuelCost: 50000,
            driverContribution: 12500, // 25% of total
            totalTrips: 10,
            totalDistance: 1350,
            averageContributionPerTrip: 1250
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Example 8: Cost sharing with different fuel prices
function fuelPriceComparisonExample() {
    console.log('\n=== Fuel Price Comparison ===');

    const fuelPrices = [1500, 1700, 2000, 2500]; // RWF per liter
    const baseRide = {
        rideId: '507f1f77bcf86cd799439022',
        totalSeats: 4,
        bookedSeats: 2
    };

    fuelPrices.forEach(pricePerLiter => {
        try {
            const fuelParams = {
                startLat: -1.9441,
                startLon: 30.0619,
                endLat: -2.5966,
                endLon: 29.7394,
                fuelEfficiency: 7.0,
                pricePerLiter
            };

            const costSharing = CostSharingCalculator.calculateCostSharing({
                ...baseRide,
                fuelParams
            });

            console.log(`Fuel Price: ${pricePerLiter} RWF/L`);
            console.log(`  - Total Fuel Cost: ${costSharing.totalFuelCost} RWF`);
            console.log(`  - Driver Pays: ${costSharing.driverShare} RWF`);
            console.log(`  - Each Passenger Pays: ${costSharing.perPassengerCost} RWF`);
            console.log('');

        } catch (error) {
            console.error(`Error with price ${pricePerLiter}:`, error.message);
        }
    });
}

// Run all examples
async function runAllExamples() {
    console.log('💰 Cost Sharing Calculator Examples\n');

    basicCostSharingExample();
    costSharingWithFuelCalculationExample();
    multipleRidesCostSharingExample();
    passengerSavingsExample();
    seatingScenariosExample();
    validationExample();
    await driverContributionExample();
    fuelPriceComparisonExample();

    console.log('\n✅ All cost sharing examples completed!');
}

// Export for use in other files
module.exports = {
    basicCostSharingExample,
    costSharingWithFuelCalculationExample,
    multipleRidesCostSharingExample,
    passengerSavingsExample,
    seatingScenariosExample,
    validationExample,
    driverContributionExample,
    fuelPriceComparisonExample,
    runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
    runAllExamples().catch(console.error);
} 