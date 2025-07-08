# Cost Sharing System

A comprehensive cost-sharing system for ride-sharing where drivers pay 25% of fuel costs and passengers split the remaining 75% evenly among available seats.

## 🎯 Cost Sharing Logic

### **Driver Contribution: 25%**
- Driver pays 25% of the total fuel cost
- This covers the driver's portion of the trip cost
- Encourages drivers to be fuel-efficient

### **Passenger Contribution: 75%**
- Passengers collectively pay 75% of the total fuel cost
- This amount is split evenly among **available seats** (not booked seats)
- Ensures fair distribution based on capacity

## 📊 Calculation Examples

### Example 1: 4-seat car with 1 passenger
```
Total Fuel Cost: 8,000 RWF
Driver Pays: 2,000 RWF (25%)
Passengers Pay: 6,000 RWF (75%)
Available Seats: 3 (4 total - 1 booked)
Each Passenger Pays: 2,000 RWF (6,000 ÷ 3)
```

### Example 2: 6-seat van with 3 passengers
```
Total Fuel Cost: 12,000 RWF
Driver Pays: 3,000 RWF (25%)
Passengers Pay: 9,000 RWF (75%)
Available Seats: 3 (6 total - 3 booked)
Each Passenger Pays: 3,000 RWF (9,000 ÷ 3)
```

### Example 3: Full car (no available seats)
```
Total Fuel Cost: 8,000 RWF
Driver Pays: 2,000 RWF (25%)
Passengers Pay: 6,000 RWF (75%)
Available Seats: 0 (4 total - 4 booked)
Each Passenger Pays: 0 RWF (no available seats to split cost)
```

## 🛠️ Implementation

### Core Utility: `CostSharingCalculator`

```javascript
const CostSharingCalculator = require('./costSharingCalculator');

// Basic calculation
const costSharing = CostSharingCalculator.calculateCostSharing({
    rideId: '507f1f77bcf86cd799439011',
    totalSeats: 4,
    bookedSeats: 1,
    fuelCost: 8000
});
```

### Key Methods

#### 1. `calculateCostSharing(rideData)`
Calculates cost sharing for a single ride.

**Parameters:**
- `rideId`: Unique ride identifier
- `totalSeats`: Total available seats in vehicle
- `bookedSeats`: Number of seats already booked
- `fuelCost`: Total fuel cost (optional)
- `fuelParams`: Fuel calculation parameters (if fuelCost not provided)

**Returns:**
```javascript
{
    rideId: '507f1f77bcf86cd799439011',
    totalFuelCost: 8000,
    driverShare: 2000,        // 25% of total
    passengerShare: 6000,     // 75% of total
    totalSeats: 4,
    bookedSeats: 1,
    availableSeats: 3,
    perPassengerCost: 2000,   // 6000 ÷ 3
    breakdown: {
        driver: {
            percentage: 25,
            amount: 2000,
            description: 'Driver pays 25% of fuel cost'
        },
        passengers: {
            percentage: 75,
            totalAmount: 6000,
            perPassenger: 2000,
            description: 'Passengers split 75% among 3 available seats'
        }
    }
}
```

#### 2. `calculateCostSharingFromDatabase(rideId, totalSeats, bookedSeats)`
Calculates cost sharing using fuel cost from the database.

#### 3. `calculateCostSharingForMultipleRides(rides)`
Calculates cost sharing for multiple rides at once.

#### 4. `calculateDriverFuelContribution(driverId, startDate, endDate)`
Calculates total driver contribution for a time period.

#### 5. `calculatePassengerSavings(costSharing, fullFuelCost)`
Calculates how much passengers save compared to paying full fuel cost.

## 🌐 API Endpoints

### 1. Calculate Cost Sharing for a Ride
```http
POST /api/cost-sharing/calculate/:rideId
Content-Type: application/json

{
    "fuelCost": 8000
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "costSharing": {
            "rideId": "507f1f77bcf86cd799439011",
            "totalFuelCost": 8000,
            "driverShare": 2000,
            "passengerShare": 6000,
            "perPassengerCost": 2000
        },
        "report": {
            "summary": {
                "driverPays": "2000 RWF (25%)",
                "eachPassengerPays": "2000 RWF",
                "totalPassengerContribution": "6000 RWF (75%)"
            }
        }
    }
}
```

### 2. Calculate Using Database Fuel Cost
```http
GET /api/cost-sharing/calculate/:rideId/database
```

### 3. Calculate for Multiple Rides
```http
POST /api/cost-sharing/calculate/multiple
Content-Type: application/json

{
    "rides": [
        {
            "rideId": "507f1f77bcf86cd799439011",
            "totalSeats": 4,
            "bookedSeats": 1,
            "fuelCost": 8000
        },
        {
            "rideId": "507f1f77bcf86cd799439012",
            "totalSeats": 6,
            "bookedSeats": 3,
            "fuelCost": 12000
        }
    ]
}
```

### 4. Driver Contribution for Period
```http
GET /api/cost-sharing/driver/:driverId/contribution?startDate=2024-01-01&endDate=2024-12-31
```

### 5. Passenger Savings Calculation
```http
POST /api/cost-sharing/rides/:rideId/savings
Content-Type: application/json

{
    "fullFuelCost": 10000
}
```

### 6. Agency Statistics
```http
GET /api/cost-sharing/agency/:agencyId/stats?startDate=2024-01-01&endDate=2024-12-31
```

### 7. Validate Parameters
```http
POST /api/cost-sharing/validate
Content-Type: application/json

{
    "params": {
        "rideId": "507f1f77bcf86cd799439011",
        "totalSeats": 4,
        "bookedSeats": 2,
        "fuelCost": 8000
    }
}
```

## 📈 Business Logic Benefits

### **For Drivers:**
- **Fair Contribution**: 25% is reasonable for vehicle operation
- **Incentive for Efficiency**: Lower fuel costs mean lower personal contribution
- **Transparency**: Clear understanding of costs

### **For Passengers:**
- **Cost Savings**: Split costs among multiple passengers
- **Fair Distribution**: Pay based on available capacity, not bookings
- **Predictable Costs**: Clear calculation method

### **For the Platform:**
- **Encourages Sharing**: More passengers = lower individual costs
- **Transparent Pricing**: Clear cost breakdown
- **Scalable Model**: Works for any vehicle size

## 🔧 Integration with Existing Systems

### **Ride Model Integration**
```javascript
// In ride creation/update
const costSharing = await CostSharingCalculator.calculateCostSharingFromDatabase(
    rideId,
    ride.seats,
    ride.booked_seats
);

// Store cost sharing info in ride
ride.costSharing = {
    driverShare: costSharing.driverShare,
    perPassengerCost: costSharing.perPassengerCost,
    lastCalculated: new Date()
};
```

### **Fuel Cost Integration**
```javascript
// When fuel cost is updated
const fuelCostRecord = await FuelCostCalculator.updateFuelCostRecord(
    rideId,
    actualFuelUsed,
    actualFuelCost
);

// Recalculate cost sharing
const updatedCostSharing = await CostSharingCalculator.calculateCostSharingFromDatabase(
    rideId,
    ride.seats,
    ride.booked_seats
);
```

## 📊 Reporting and Analytics

### **Driver Reports**
- Total fuel contribution over time
- Average contribution per trip
- Cost efficiency trends

### **Passenger Reports**
- Savings compared to full fuel cost
- Cost per trip analysis
- Fairness verification

### **Agency Reports**
- Total cost sharing across all rides
- Driver vs passenger contribution ratios
- Fuel efficiency impact on costs

## 🧪 Testing

Run the example file to test functionality:

```bash
node src/Utilities/costSharingExample.js
```

## 🔒 Validation Rules

### **Input Validation:**
- Ride ID must be provided
- Total seats must be > 0
- Booked seats must be between 0 and total seats
- Fuel cost must be >= 0
- Either fuelCost or fuelParams must be provided

### **Business Rules:**
- Driver always pays 25% regardless of occupancy
- Passenger cost is split among available seats only
- Empty vehicles still have driver contribution
- Full vehicles have no additional passenger cost

## 🚀 Usage Examples

### **Frontend Integration**
```javascript
// Calculate cost sharing for display
const response = await fetch(`/api/cost-sharing/calculate/${rideId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fuelCost: 8000 })
});

const { costSharing } = await response.json();

// Display to users
console.log(`Driver pays: ${costSharing.driverShare} RWF`);
console.log(`Each passenger pays: ${costSharing.perPassengerCost} RWF`);
```

### **Backend Integration**
```javascript
// In ride booking process
const costSharing = await CostSharingCalculator.calculateCostSharingFromDatabase(
    rideId,
    ride.seats,
    ride.booked_seats
);

// Update ride with cost sharing info
await Ride.findByIdAndUpdate(rideId, {
    $set: {
        'costSharing.driverShare': costSharing.driverShare,
        'costSharing.perPassengerCost': costSharing.perPassengerCost,
        'costSharing.lastCalculated': new Date()
    }
});
```

This cost-sharing system provides a fair, transparent, and scalable way to distribute fuel costs between drivers and passengers in your ride-sharing platform. 