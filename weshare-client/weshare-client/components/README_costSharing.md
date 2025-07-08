# Frontend Cost Sharing Implementation

This document describes the frontend implementation of the cost sharing feature for private rides in the WeShare app.

## 🎯 Overview

The cost sharing feature allows users to see a detailed breakdown of how fuel costs are distributed between drivers and passengers for private rides. The system follows a 25% driver / 75% passenger split model.

## 📱 Components

### 1. CostSharingBreakdown Component

**Location:** `components/CostSharingBreakdown.js`

A collapsible component that displays detailed cost sharing information for a private ride.

**Features:**
- Expandable/collapsible interface
- Real-time cost calculation from backend API
- Error handling with retry functionality
- Loading states
- Detailed breakdown of costs

**Props:**
```javascript
{
    ride: Object,           // Ride object with _id
    isExpanded: Boolean,    // Whether the breakdown is expanded
    onToggle: Function      // Callback when toggle is pressed
}
```

**Usage:**
```javascript
import CostSharingBreakdown from './CostSharingBreakdown';

<CostSharingBreakdown
    ride={rideData}
    isExpanded={showBreakdown}
    onToggle={() => setShowBreakdown(!showBreakdown)}
/>
```

### 2. Updated RideCard Component

**Location:** `components/RideCard.js`

The main ride card component has been enhanced to include cost sharing breakdown for private rides.

**New Features:**
- Cost sharing breakdown section for private rides
- Toggle functionality to show/hide cost details
- Integration with CostSharingBreakdown component

**Props:**
```javascript
{
    // ... existing props
    isPrivate: Boolean,     // Whether this is a private ride
    // ... other props
}
```

## 🪝 Custom Hooks

### 1. useCostSharing Hook

**Location:** `hooks/useCostSharing.js`

A custom hook for managing cost sharing data fetching and state.

**Parameters:**
```javascript
useCostSharing(rideId, enabled = true)
```

**Returns:**
```javascript
{
    costSharing: Object,    // Cost sharing data
    loading: Boolean,       // Loading state
    error: String,          // Error message
    refetch: Function       // Function to refetch data
}
```

**Usage:**
```javascript
import { useCostSharing } from '../hooks/useCostSharing';

const { costSharing, loading, error, refetch } = useCostSharing(rideId, isExpanded);
```

### 2. useCostSharingCalculation Hook

**Location:** `hooks/useCostSharing.js`

A hook for calculating cost sharing with custom parameters.

**Parameters:**
```javascript
useCostSharingCalculation(rideData, enabled = true)
```

**Usage:**
```javascript
const rideData = {
    rideId: '507f1f77bcf86cd799439011',
    totalSeats: 4,
    bookedSeats: 1,
    fuelCost: 8000
};

const { costSharing, loading, error, calculateCostSharing } = useCostSharingCalculation(rideData);
```

### 3. useMultipleRidesCostSharing Hook

**Location:** `hooks/useCostSharing.js`

A hook for calculating cost sharing for multiple rides at once.

**Parameters:**
```javascript
useMultipleRidesCostSharing(rides, enabled = true)
```

**Usage:**
```javascript
const rides = [
    { rideId: '1', totalSeats: 4, bookedSeats: 1, fuelCost: 8000 },
    { rideId: '2', totalSeats: 6, bookedSeats: 3, fuelCost: 12000 }
];

const { costSharingResults, loading, error, calculateMultipleRides } = useMultipleRidesCostSharing(rides);
```

### 4. useDriverContribution Hook

**Location:** `hooks/useCostSharing.js`

A hook for calculating driver contribution over a time period.

**Parameters:**
```javascript
useDriverContribution(driverId, startDate, endDate, enabled = true)
```

**Usage:**
```javascript
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-12-31');

const { contribution, loading, error, calculateDriverContribution } = useDriverContribution(
    driverId,
    startDate,
    endDate
);
```

## 🔧 API Integration

### Backend Endpoints

The frontend integrates with the following backend endpoints:

1. **Get Cost Sharing from Database**
   ```http
   GET /api/cost/calculate/:rideId/database
   ```

2. **Calculate Cost Sharing with Parameters**
   ```http
   POST /api/cost/calculate/:rideId
   Content-Type: application/json
   
   {
       "fuelCost": 8000,
       "fuelParams": {
           "startLat": -1.9441,
           "startLon": 30.0619,
           "endLat": -2.5966,
           "endLon": 29.7394,
           "fuelEfficiency": 7.0,
           "pricePerLiter": 1700
       }
   }
   ```

3. **Calculate Multiple Rides**
   ```http
   POST /api/cost/calculate/multiple
   Content-Type: application/json
   
   {
       "rides": [
           {
               "rideId": "507f1f77bcf86cd799439011",
               "totalSeats": 4,
               "bookedSeats": 1,
               "fuelCost": 8000
           }
       ]
   }
   ```

4. **Driver Contribution**
   ```http
   GET /api/cost/driver/:driverId/contribution?startDate=2024-01-01&endDate=2024-12-31
   ```

## 🎨 UI/UX Features

### Visual Design

- **Color Coding:**
  - Driver contribution: Blue (#2196F3)
  - Passenger contribution: Purple (#9C27B0)
  - Total fuel cost: Orange (#FF9800)
  - Per-seat cost: Green (#4CAF50)

- **Icons:**
  - Calculator icon for cost breakdown
  - Gas pump for fuel costs
  - User icons for driver/passenger sections
  - Chair icon for per-seat breakdown

### User Experience

- **Collapsible Interface:** Users can expand/collapse cost breakdown to save space
- **Loading States:** Clear indication when data is being fetched
- **Error Handling:** User-friendly error messages with retry options
- **Responsive Design:** Works well on different screen sizes

## 📊 Data Flow

1. **User Interaction:** User taps "Show Cost Breakdown" on a private ride
2. **API Call:** Frontend calls the cost sharing API with ride ID
3. **Data Processing:** Backend calculates cost sharing using fuel cost data
4. **UI Update:** Frontend displays the calculated breakdown
5. **User Feedback:** User can see detailed cost distribution

## 🔄 State Management

The cost sharing feature uses React hooks for state management:

- **Local State:** Component-level state for UI interactions
- **Custom Hooks:** Reusable logic for data fetching and calculations
- **Error Handling:** Centralized error management with retry functionality

## 🧪 Testing

### Example Component

**Location:** `components/CostSharingExample.js`

A demonstration component showing how the cost sharing feature works with sample data.

**Features:**
- Sample rides with different configurations
- Interactive cost breakdown examples
- Benefits explanation
- Educational content

## 🚀 Integration Guide

### Adding to Existing Screens

1. **Import Components:**
   ```javascript
   import CostSharingBreakdown from '../components/CostSharingBreakdown';
   ```

2. **Add to Ride Display:**
   ```javascript
   {isPrivate && (
       <CostSharingBreakdown
           ride={ride}
           isExpanded={showCostBreakdown}
           onToggle={() => setShowCostBreakdown(!showCostBreakdown)}
       />
   )}
   ```

3. **Manage State:**
   ```javascript
   const [showCostBreakdown, setShowCostBreakdown] = useState(false);
   ```

### Using Custom Hooks

1. **Import Hook:**
   ```javascript
   import { useCostSharing } from '../hooks/useCostSharing';
   ```

2. **Use in Component:**
   ```javascript
   const { costSharing, loading, error, refetch } = useCostSharing(rideId, enabled);
   ```

3. **Handle States:**
   ```javascript
   if (loading) return <LoadingSpinner />;
   if (error) return <ErrorMessage error={error} onRetry={refetch} />;
   if (costSharing) return <CostDisplay data={costSharing} />;
   ```

## 🔒 Error Handling

### Common Error Scenarios

1. **Network Errors:** Connection issues when fetching data
2. **API Errors:** Backend calculation failures
3. **Invalid Data:** Missing or invalid ride information
4. **Rate Limiting:** Too many requests

### Error Recovery

- **Retry Mechanism:** Users can retry failed requests
- **Fallback UI:** Graceful degradation when data is unavailable
- **User Feedback:** Clear error messages explaining the issue

## 📈 Performance Considerations

### Optimization Strategies

1. **Lazy Loading:** Cost sharing data is only fetched when needed
2. **Caching:** Consider implementing caching for frequently accessed data
3. **Debouncing:** Prevent excessive API calls during rapid interactions
4. **Memoization:** Use React.memo for expensive components

### Best Practices

- Only fetch cost sharing data when the breakdown is expanded
- Implement proper loading and error states
- Use appropriate React hooks for state management
- Follow the existing app's design patterns

## 🔮 Future Enhancements

### Potential Improvements

1. **Offline Support:** Cache cost sharing data for offline viewing
2. **Real-time Updates:** Update costs when ride details change
3. **Advanced Analytics:** Show cost trends and comparisons
4. **Customization:** Allow users to adjust cost sharing percentages
5. **Notifications:** Alert users when cost sharing is available

### Integration Opportunities

1. **Booking Flow:** Integrate cost sharing into the booking process
2. **Payment Integration:** Connect cost sharing with payment systems
3. **Driver Dashboard:** Show driver contribution analytics
4. **Passenger History:** Track cost savings over time

This implementation provides a comprehensive cost sharing feature that enhances the user experience for private rides while maintaining good performance and user experience standards. 