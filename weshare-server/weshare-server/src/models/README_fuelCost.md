# Fuel Cost Calculator

A comprehensive MongoDB/Mongoose data model and utility functions for calculating fuel consumption and costs for ride-sharing trips.

## Features

- **GPS-based distance calculation** using Haversine formula
- **Fuel consumption estimation** based on vehicle efficiency
- **Cost calculation** with configurable fuel prices
- **Environmental factors** (traffic, terrain, weather)
- **Database integration** with Mongoose
- **Driver statistics** and analytics
- **Trip tracking** from estimation to completion
- **Direct ride integration** - fuel costs are linked directly to rides

## Model Schema

### FuelCost Model (`src/models/fuelCost.js`)

The main model includes:

#### Primary Reference
- `rideId`: Direct reference to the Ride model (required, unique) - each ride has one fuel cost record

#### Location Information
- `startLocation`: GPS coordinates and address for trip start
- `endLocation`: GPS coordinates and address for trip end

#### Trip Data
- `distanceKm`: Calculated or provided distance in kilometers
- `status`: Trip status (estimated, in_progress, completed, cancelled)

#### Vehicle Information
- `vehicleInfo.fuelEfficiency`: Fuel consumption in L/100km
- `vehicleInfo.fuelType`: Type of fuel (petrol, diesel, hybrid, electric)
- `vehicleInfo.vehicleModel`: Vehicle model information

#### Cost Calculations
- `fuelPricePerLiter`: Current fuel price (configurable via environment)
- `estimatedFuelLiters`: Calculated fuel consumption
- `estimatedFuelCost`: Estimated total fuel cost
- `actualFuelUsed`: Actual fuel consumed (after trip completion)
- `actualFuelCost`: Actual fuel cost (after trip completion)

#### References
- `driverId`: Reference to driver/user (optional, for convenience)

## Utility Functions

### FuelCostCalculator (`src/Utilities/fuelCostCalculator.js`)

#### Basic Calculations
```javascript
// Calculate distance between GPS coordinates
const distance = FuelCostCalculator.calculateDistance(lat1, lon1, lat2, lon2);

// Calculate fuel consumption
const fuelLiters = FuelCostCalculator.calculateFuelConsumption(distanceKm, fuelEfficiency);

// Calculate fuel cost
const fuelCost = FuelCostCalculator.calculateFuelCost(fuelLiters, pricePerLiter);
```

#### Complete Trip Calculation
```javascript
const tripParams = {
    startLat: -1.9441,    // Kigali
    startLon: 30.0619,
    endLat: -2.5966,      // Butare
    endLon: 29.7394,
    fuelEfficiency: 7.0,  // 7L/100km
    pricePerLiter: 1700   // Rwandan Francs
};

const result = FuelCostCalculator.calculateTripFuelCost(tripParams);
// Returns: { distanceKm, fuelLiters, fuelCost, costPerKm, fuelEfficiencyKmPerL }
```

#### Environmental Factors
```javascript
const factors = {
    trafficFactor: 1.2,    // Heavy traffic
    terrainFactor: 1.3,    // Hilly terrain
    weatherFactor: 1.1     // Rainy weather
};

const adjustedResult = FuelCostCalculator.calculateFuelCostWithFactors(tripParams, factors);
```

#### Database Operations
```javascript
// Create a new fuel cost record linked to a ride
const fuelCostRecord = await FuelCostCalculator.createFuelCostRecord({
    rideId: '507f1f77bcf86cd799439011',
    // ... other trip data
});

// Update with actual values after trip completion
const updatedRecord = await FuelCostCalculator.updateFuelCostRecord(
    rideId, 
    actualFuelUsed, 
    actualFuelCost
);

// Get fuel cost by ride ID
const fuelCost = await FuelCostCalculator.getFuelCostByRideId(rideId);

// Get driver statistics
const stats = await FuelCostCalculator.getDriverFuelStats(driverId, startDate, endDate);

// Get agency statistics
const agencyStats = await FuelCostCalculator.getAgencyFuelStats(agencyId, startDate, endDate);
```

## Environment Configuration

Add to your `.env` file:

```env
# Default fuel price per liter (Rwandan Francs)
DEFAULT_FUEL_PRICE_PER_LITER=1700
```

## Usage Examples

### Basic Usage
```javascript
const FuelCostCalculator = require('./src/Utilities/fuelCostCalculator');

// Calculate fuel cost for a trip
const tripParams = {
    startLat: -1.9441,
    startLon: 30.0619,
    endLat: -2.5966,
    endLon: 29.7394,
    fuelEfficiency: 7.0,
    pricePerLiter: 1700
};

const result = FuelCostCalculator.calculateTripFuelCost(tripParams);
console.log(`Distance: ${result.distanceKm}km`);
console.log(`Fuel needed: ${result.fuelLiters}L`);
console.log(`Cost: ${result.fuelCost} RWF`);
```

### Creating Database Records Linked to Rides
```javascript
const tripData = {
    rideId: '507f1f77bcf86cd799439011', // Link to existing ride
    startLocation: {
        latitude: -1.9441,
        longitude: 30.0619,
        address: 'Kigali, Rwanda'
    },
    endLocation: {
        latitude: -2.5966,
        longitude: 29.7394,
        address: 'Butare, Rwanda'
    },
    distanceKm: 135.5,
    vehicleInfo: {
        fuelEfficiency: 7.0,
        fuelType: 'petrol',
        vehicleModel: 'Toyota Corolla'
    },
    fuelPricePerLiter: 1700,
    driverId: '507f1f77bcf86cd799439012'
};

const fuelCostRecord = await FuelCostCalculator.createFuelCostRecord(tripData);
```

### Vehicle-Specific Calculations
```javascript
const vehicles = ['sedan', 'suv', 'truck', 'bus'];
const distance = 100;

vehicles.forEach(vehicleType => {
    const efficiency = FuelCostCalculator.getDefaultFuelEfficiency(vehicleType);
    const consumption = FuelCostCalculator.calculateFuelConsumption(distance, efficiency);
    console.log(`${vehicleType}: ${consumption}L for ${distance}km`);
});
```

## Default Fuel Efficiencies

| Vehicle Type | Fuel Efficiency (L/100km) |
|--------------|---------------------------|
| Sedan        | 7.0                       |
| SUV          | 9.0                       |
| Truck        | 12.0                      |
| Bus          | 15.0                      |
| Motorcycle   | 3.0                       |
| Hybrid       | 5.0                       |
| Electric     | 0.0                       |

## Database Indexes

The model includes optimized indexes for:
- `rideId` (unique) - primary relationship with rides
- `driverId` (for driver-based queries)
- `status` (for filtering)
- `estimatedAt` (for date-based queries)
- GPS coordinates (for location-based queries)

## Virtual Properties

The model provides virtual properties for:
- `costPerKm`: Cost per kilometer
- `fuelEfficiencyKmPerL`: Fuel efficiency in km/L
- `costDifference`: Difference between estimated and actual costs

## Validation

The model includes comprehensive validation:
- GPS coordinates within valid ranges
- Positive distances and fuel amounts
- Reasonable fuel efficiency ranges (0-50 L/100km)
- Required fields validation
- Unique rideId constraint (one fuel cost record per ride)

## Integration with Existing Models

The fuel cost model is directly integrated with:
- **Ride Model**: Each fuel cost record is linked to exactly one ride via `rideId`
- **User Model**: Driver information via `driverId` (for convenience)
- **Agency Model**: Agency statistics via ride relationships

## Key Benefits of Ride Integration

1. **One-to-One Relationship**: Each ride has exactly one fuel cost record
2. **Simplified Queries**: Easy to find fuel costs for specific rides
3. **Data Consistency**: No orphaned fuel cost records
4. **Business Logic**: Fuel costs are inherently tied to rides
5. **Audit Trail**: Complete history of fuel costs per ride

## Testing

Run the example file to test functionality:

```bash
node src/Utilities/fuelCostExample.js
```

## API Integration

To integrate with your API routes, create controllers that use the utility functions:

```javascript
// Example API endpoint for ride fuel cost
app.get('/api/rides/:rideId/fuel-cost', async (req, res) => {
    try {
        const fuelCost = await FuelCostCalculator.getFuelCostByRideId(req.params.rideId);
        res.json(fuelCost);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Example API endpoint for calculating fuel cost
app.post('/api/fuel-cost/calculate', async (req, res) => {
    try {
        const result = FuelCostCalculator.calculateTripFuelCost(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

## Contributing

When adding new features:
1. Update the model schema if needed
2. Add corresponding utility functions
3. Update this documentation
4. Add tests for new functionality 