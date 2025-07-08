# GPS-Based Pricing System Implementation

This document describes the implementation of the new GPS-based pricing system for the WeShare app, which automatically calculates ride pricing based on GPS coordinates and fuel costs instead of manual price entry.

## 🎯 Overview

The new pricing system replaces manual price entry with automatic calculation based on:
- GPS coordinates (start and end locations)
- Distance calculation using Haversine formula
- Fuel efficiency and current fuel prices
- Cost sharing model (25% driver / 75% passengers)

## 📱 Frontend Components

### 1. LocationPicker Component

**Location:** `components/LocationPicker.js`

A comprehensive location selection component with GPS coordinate support.

**Features:**
- GPS coordinate selection with map integration
- Current location detection
- Common locations in Rwanda
- Manual coordinate entry
- Location search functionality
- Coordinate validation

**Props:**
```javascript
{
    value: Object,              // Current location object
    onLocationSelect: Function, // Callback when location is selected
    placeholder: String,        // Input placeholder text
    label: String,             // Field label
    required: Boolean,         // Whether field is required
    showCoordinates: Boolean,  // Whether to show coordinate inputs
    style: Object             // Custom styles
}
```

**Location Object Structure:**
```javascript
{
    name: String,      // Location name (e.g., "Kigali")
    latitude: Number,  // GPS latitude
    longitude: Number  // GPS longitude
}
```

**Usage:**
```javascript
import LocationPicker from '../components/LocationPicker';

<LocationPicker
    value={startLocation}
    onLocationSelect={setStartLocation}
    placeholder="Enter departure location"
    label="From"
    required={true}
    showCoordinates={true}
/>
```

### 2. PricingPreview Component

**Location:** `components/PricingPreview.js`

Real-time pricing calculation and preview component.

**Features:**
- Automatic pricing calculation based on GPS coordinates
- Real-time updates when parameters change
- Detailed cost breakdown
- Cost sharing visualization
- Expandable interface for detailed view

**Props:**
```javascript
{
    startLocation: Object,     // Starting location with GPS coordinates
    endLocation: Object,       // Destination location with GPS coordinates
    seats: Number,            // Number of available seats
    fuelEfficiency: Number,   // Vehicle fuel efficiency (L/100km)
    pricePerLiter: Number,    // Current fuel price (RWF/L)
    onPriceCalculated: Function, // Callback when pricing is calculated
    style: Object             // Custom styles
}
```

**Usage:**
```javascript
import PricingPreview from '../components/PricingPreview';

<PricingPreview
    startLocation={startLocation}
    endLocation={endLocation}
    seats={parseInt(seats) || 0}
    fuelEfficiency={parseFloat(fuelEfficiency) || 7.0}
    pricePerLiter={parseFloat(pricePerLiter) || 1700}
    onPriceCalculated={handlePriceCalculated}
/>
```

### 3. Updated RideCard Component

**Location:** `components/RideCard.js`

Enhanced ride card with GPS-based pricing display.

**New Features:**
- GPS coordinate display for private rides
- Calculated pricing indication
- Fuel efficiency information
- Support for both old and new pricing models

**GPS Information Display:**
- Shows GPS coordinates for private rides
- Displays "per seat (calculated)" for automatic pricing
- Shows fuel efficiency when available

## 🔧 Backend Integration

### API Endpoints

#### 1. Pricing Preview Calculation
```http
POST /api/cost-sharing/calculate/preview
Content-Type: application/json

{
    "startLat": -1.9441,
    "startLon": 30.0619,
    "endLat": -2.5966,
    "endLon": 29.7394,
    "seats": 4,
    "fuelEfficiency": 7.0,
    "pricePerLiter": 1700
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "distance": 85.2,
        "fuelLiters": 5.96,
        "totalFuelCost": 10132,
        "fuelEfficiency": 7.0,
        "pricePerLiter": 1700,
        "seats": 4,
        "driverShare": 2533,
        "passengerShare": 7599,
        "perPassengerCost": 1899.75,
        "availableSeats": 4
    }
}
```

### Updated Ride Creation

The ride creation process now includes GPS coordinates and automatic pricing:

```javascript
const rideData = {
    startLocation: {
        name: startLocation.name,
        latitude: startLocation.latitude,
        longitude: startLocation.longitude
    },
    endLocation: {
        name: endLocation.name,
        latitude: endLocation.latitude,
        longitude: endLocation.longitude
    },
    date: formattedDate,
    time: formattedTime,
    description,
    estimatedArrivalTime: numEta,
    licensePlate,
    isPrivate: true,
    seats: numSeats,
    fuelEfficiency: numFuelEfficiency,
    pricePerLiter: numPricePerLiter,
    calculatedPrice: calculatedPrice.perPassengerCost,
    wheelchairAccessible
};
```

## 📊 Pricing Calculation Logic

### 1. Distance Calculation
Uses Haversine formula to calculate distance between GPS coordinates:
```javascript
distance = calculateDistance(startLat, startLon, endLat, endLon)
```

### 2. Fuel Consumption
```javascript
fuelLiters = (distance * fuelEfficiency) / 100
```

### 3. Total Fuel Cost
```javascript
totalFuelCost = fuelLiters * pricePerLiter
```

### 4. Cost Sharing
- Driver pays 25% of total fuel cost
- Passengers split 75% among available seats
- Per-seat cost = passengerShare / availableSeats

## 🗺️ Location Services

### Dependencies
Added `expo-location` for GPS functionality:
```json
{
    "expo-location": "~18.1.2"
}
```

### Common Locations
Pre-configured locations in Rwanda:
- Kigali: -1.9441, 30.0619
- Butare: -2.5966, 29.7394
- Gisenyi: -1.7028, 29.2564
- Musanze: -1.4998, 29.6344
- Kibuye: -2.0603, 29.3478
- And more...

### Location Permissions
The app requests location permissions to:
- Get current user location
- Provide location-based suggestions
- Enable GPS coordinate selection

## 🎨 User Experience

### Form Flow
1. **Location Selection**: Users select start and end locations
2. **GPS Coordinates**: Automatic coordinate detection or manual entry
3. **Vehicle Settings**: Configure fuel efficiency and fuel price
4. **Pricing Preview**: Real-time pricing calculation and breakdown
5. **Ride Creation**: Submit with calculated pricing

### Visual Indicators
- GPS coordinates displayed for transparency
- "per seat (calculated)" label for automatic pricing
- Expandable pricing breakdown
- Real-time calculation feedback

### Error Handling
- GPS coordinate validation
- Location permission handling
- Network error recovery
- Invalid parameter feedback

## 🔄 Migration Strategy

### Backward Compatibility
The system supports both old and new pricing models:
- Old rides: Display manual price with location names
- New rides: Display calculated price with GPS coordinates
- Mixed display: Shows appropriate information for each ride type

### Data Structure
```javascript
// Old format (still supported)
{
    from: "Kigali",
    to: "Butare",
    price: 8000
}

// New format
{
    startLocation: {
        name: "Kigali",
        latitude: -1.9441,
        longitude: 30.0619
    },
    endLocation: {
        name: "Butare",
        latitude: -2.5966,
        longitude: 29.7394
    },
    calculatedPrice: 1899.75,
    fuelEfficiency: 7.0,
    pricePerLiter: 1700
}
```

## 🧪 Testing

### Location Picker Testing
- GPS coordinate accuracy
- Location search functionality
- Current location detection
- Manual coordinate entry
- Error handling

### Pricing Calculation Testing
- Distance calculation accuracy
- Fuel cost calculation
- Cost sharing distribution
- Real-time updates
- Parameter validation

### Integration Testing
- End-to-end ride creation
- API endpoint functionality
- Data persistence
- UI state management

## 🚀 Performance Considerations

### Optimization Strategies
- Lazy loading of location data
- Debounced pricing calculations
- Cached location suggestions
- Efficient GPS coordinate handling

### Best Practices
- Request location permissions only when needed
- Validate GPS coordinates before API calls
- Handle network errors gracefully
- Provide fallback options for location services

## 🔮 Future Enhancements

### Potential Improvements
1. **Map Integration**: Visual map selection for locations
2. **Route Optimization**: Multiple route options with different pricing
3. **Dynamic Fuel Prices**: Real-time fuel price updates
4. **Traffic Integration**: Traffic-based pricing adjustments
5. **Historical Data**: Pricing trends and analytics

### Advanced Features
- **Multi-stop Routes**: Support for multiple destinations
- **Vehicle Profiles**: Saved vehicle configurations
- **Pricing Templates**: Pre-configured pricing models
- **A/B Testing**: Different pricing strategies

## 📋 Implementation Checklist

### Frontend
- [x] LocationPicker component
- [x] PricingPreview component
- [x] Updated RideCard component
- [x] GPS coordinate validation
- [x] Location permissions handling
- [x] Error handling and user feedback

### Backend
- [x] Pricing preview API endpoint
- [x] GPS coordinate validation
- [x] Distance calculation integration
- [x] Cost sharing calculation
- [x] Error handling and validation

### Integration
- [x] API endpoint registration
- [x] Frontend-backend communication
- [x] Data persistence
- [x] Backward compatibility
- [x] Testing and validation

This implementation provides a comprehensive GPS-based pricing system that enhances transparency, accuracy, and user experience while maintaining backward compatibility with existing rides. 