# Rules Engine Integration

This document explains how the JSON-based rules engine is integrated into the weshare-server project to validate business actions before they proceed.

## Overview

The rules engine provides centralized validation for ride and booking actions, ensuring business rules are consistently enforced across the application. It validates actions against defined conditions and can trigger post-actions when validations pass.

## Architecture

### Components

1. **`src/rules/rideRules.js`** - Contains the JSON rule definitions
2. **`src/Utilities/ruleValidator.js`** - Core validation logic
3. **`src/middleware/ruleValidationMiddleware.js`** - Express middleware integration
4. **Controller Integration** - Direct validation in controller methods

### Rule Structure

Rules are defined in a hierarchical structure:

```javascript
{
  "entity": {
    "action": {
      "allowed_if": { /* conditions that must be met */ },
      "denied_if": [ /* conditions that prevent the action */ ],
      "post_action": { /* actions to take after successful validation */ }
    }
  }
}
```

## Usage Examples

### 1. Direct Controller Integration (Recommended)

This approach integrates validation directly into existing controller methods:

```javascript
const ruleValidator = require('../Utilities/ruleValidator');

const deleteRide = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the ride first
        const ride = await Ride.findById(id);
        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        // Validate against business rules
        const context = ruleValidator.createRideContext(ride, req.user);
        const validationResult = ruleValidator.validateAction('ride', 'delete', context);
        
        if (!validationResult.isValid) {
            return res.status(400).json({ 
                error: validationResult.message,
                action: 'ride.delete'
            });
        }

        // Proceed with action if validation passes
        await Ride.findByIdAndDelete(id);
        res.status(200).json({ message: 'Ride deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete ride' });
    }
};
```

### 2. Middleware Integration

For more complex scenarios, you can use the middleware approach:

```javascript
const { createRuleValidationMiddleware, contextBuilders } = require('../middleware/ruleValidationMiddleware');

// In your routes file
router.delete('/rides/:id', 
    authController.protect,
    createRuleValidationMiddleware('ride', 'delete', contextBuilders.rideAction),
    rideController.deleteRide
);
```

## Rule Definitions

### Ride Rules

#### Delete Ride
- **Allowed if**: No bookings, active status, future departure
- **Denied if**: Has bookings, already cancelled, past departure
- **Post-action**: None

#### Cancel Ride
- **Allowed if**: More than 30 minutes before departure, active status
- **Denied if**: Already cancelled, past departure
- **Post-action**: Change status to cancelled, notify booked users

### Booking Rules

#### Create Booking
- **Allowed if**: Ride is active, seats available, more than 10 minutes before departure
- **Denied if**: Ride cancelled, no seats, departure time passed
- **Post-action**: None

#### Cancel Booking
- **Allowed if**: More than 30 minutes before departure, pending status
- **Denied if**: Too close to departure, already completed
- **Post-action**: Free up seat

## Context Builders

The system provides helper methods to build context objects:

### `createRideContext(ride, user)`
Creates context for ride-related actions:
```javascript
{
  bookings_count: 2,
  status: 'active',
  departure_time: Date,
  available_seats: 2,
  ride_status: 'active',
  user: userObject
}
```

### `createBookingContext(booking, ride, user)`
Creates context for booking-related actions:
```javascript
{
  status: 'pending',
  departure_time: Date,
  ride_status: 'active',
  available_seats: 2,
  user: userObject
}
```

## Validation Logic

### Condition Evaluation

The validator supports various condition types:

1. **Simple equality**: `"status": "active"`
2. **Time comparisons**: `"departure_time": "in_future"`
3. **Numeric comparisons**: `"bookings_count": { "greater_than": 0 }`
4. **Time-based comparisons**: `"departure_time": { "minutes_from_now": { "greater_than": 30 } }`

### Priority Order

1. **Denied conditions** are checked first (take precedence)
2. **Allowed conditions** are checked if no denied conditions match
3. **Post-actions** are executed if validation passes

## Testing

Unit tests are provided in `test/ruleValidator.test.js` to verify:

- Valid actions are allowed
- Invalid actions are blocked with appropriate messages
- Post-actions are correctly identified
- Edge cases are handled properly

Run tests with:
```bash
npm test test/ruleValidator.test.js
```

## Extending the Rules

### Adding New Rules

1. Add rule definition to `src/rules/rideRules.js`
2. Create appropriate context builder if needed
3. Add validation logic to controller or middleware
4. Write tests for the new rule

### Adding New Condition Types

1. Extend the `compareValues()` method in `ruleValidator.js`
2. Add new comparison logic in `compareObjectValues()`
3. Update tests to cover new condition types

## Integration Points

The rules engine integrates with:

- **Controllers**: Direct validation before database operations
- **Middleware**: Pre-request validation
- **Error Handling**: Consistent error responses
- **Logging**: Validation failures are logged for monitoring

## Benefits

1. **Centralized Logic**: All business rules in one place
2. **Consistency**: Same validation across all endpoints
3. **Maintainability**: Easy to modify rules without changing controllers
4. **Testability**: Rules can be tested independently
5. **Flexibility**: Easy to add new rules and conditions
6. **Performance**: Validation happens before expensive database operations

## Future Enhancements

- Database-driven rules (for dynamic rule management)
- Rule versioning and migration
- Advanced condition types (regex, complex date ranges)
- Rule performance metrics and monitoring
- Rule conflict detection and resolution 