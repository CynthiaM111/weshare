const ruleValidator = require('../src/Utilities/ruleValidator');

describe('Rule Validator Tests', () => {
    describe('Ride Delete Validation', () => {
        test('should allow deletion of ride with no bookings', () => {
            const ride = {
                bookedBy: [],
                status: 'active',
                departure_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                seats: 4,
                booked_seats: 0
            };

            const context = ruleValidator.createRideContext(ride);
            const result = ruleValidator.validateAction('ride', 'delete', context);

            expect(result.isValid).toBe(true);
            expect(result.message).toBe('Action is allowed');
        });

        test('should deny deletion of ride with existing bookings', () => {
            const ride = {
                bookedBy: [{ userId: 'user1' }, { userId: 'user2' }],
                status: 'active',
                departure_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                seats: 4,
                booked_seats: 2
            };

            const context = ruleValidator.createRideContext(ride);
            const result = ruleValidator.validateAction('ride', 'delete', context);

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Cannot delete a ride with existing bookings. Please cancel instead.');
        });

        test('should deny deletion of already cancelled ride', () => {
            const ride = {
                bookedBy: [],
                status: 'canceled',
                departure_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                seats: 4,
                booked_seats: 0
            };

            const context = ruleValidator.createRideContext(ride);
            const result = ruleValidator.validateAction('ride', 'delete', context);

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Ride is already cancelled. Cannot delete.');
        });

        test('should deny deletion of past ride', () => {
            const ride = {
                bookedBy: [],
                status: 'active',
                departure_time: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
                seats: 4,
                booked_seats: 0
            };

            const context = ruleValidator.createRideContext(ride);
            const result = ruleValidator.validateAction('ride', 'delete', context);

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Cannot delete a past ride.');
        });
    });

    describe('Booking Creation Validation', () => {
        test('should allow booking on available ride', () => {
            const ride = {
                status: 'active',
                departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
                seats: 4,
                booked_seats: 2
            };

            const context = ruleValidator.createRideContext(ride);
            const result = ruleValidator.validateAction('booking', 'create', context);

            expect(result.isValid).toBe(true);
            expect(result.message).toBe('Action is allowed');
        });

        test('should deny booking on cancelled ride', () => {
            const ride = {
                status: 'canceled',
                departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
                seats: 4,
                booked_seats: 2
            };

            const context = ruleValidator.createRideContext(ride);
            const result = ruleValidator.validateAction('booking', 'create', context);

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Cannot book a cancelled ride.');
        });

        test('should deny booking on full ride', () => {
            const ride = {
                status: 'active',
                departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
                seats: 4,
                booked_seats: 4
            };

            const context = ruleValidator.createRideContext(ride);
            const result = ruleValidator.validateAction('booking', 'create', context);

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('No available seats.');
        });

        test('should deny booking on ride that has already started', () => {
            const ride = {
                status: 'active',
                departure_time: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                seats: 4,
                booked_seats: 2
            };

            const context = ruleValidator.createRideContext(ride);
            const result = ruleValidator.validateAction('booking', 'create', context);

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Cannot book a ride that has already started.');
        });
    });

    describe('Booking Cancellation Validation', () => {
        test('should allow cancellation with sufficient notice', () => {
            const booking = {
                checkInStatus: 'pending'
            };

            const ride = {
                departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
            };

            const user = { id: 'user1' };

            const context = ruleValidator.createBookingContext(booking, ride, user);
            const result = ruleValidator.validateAction('booking', 'cancel', context);

            expect(result.isValid).toBe(true);
            expect(result.message).toBe('Action is allowed');
            expect(result.postAction).toEqual({ free_up_seat: true });
        });

        test('should deny cancellation too close to departure', () => {
            const booking = {
                checkInStatus: 'pending'
            };

            const ride = {
                departure_time: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
            };

            const user = { id: 'user1' };

            const context = ruleValidator.createBookingContext(booking, ride, user);
            const result = ruleValidator.validateAction('booking', 'cancel', context);

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('You cannot cancel your booking less than 30 minutes before departure.');
        });

        test('should deny cancellation of completed booking', () => {
            const booking = {
                checkInStatus: 'completed'
            };

            const ride = {
                departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
            };

            const user = { id: 'user1' };

            const context = ruleValidator.createBookingContext(booking, ride, user);
            const result = ruleValidator.validateAction('booking', 'cancel', context);

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Booking is already completed.');
        });
    });
}); 