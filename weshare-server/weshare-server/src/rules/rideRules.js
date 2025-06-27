const rideRules = {
    "ride": {
        "delete": {
            "allowed_if": {
                "bookings_count": 0,
                "status": "active",
                "departure_time": "in_future"
            },
            "denied_if": [
                {
                    "bookings_count": { "greater_than": 0 },
                    "error": "Cannot delete ride with existing bookings. Please cancel the ride instead to notify passengers.",
                    "error_code": "RIDE_HAS_BOOKINGS"
                },
                {
                    "status": "canceled",
                    "error": "This ride has already been canceled and cannot be deleted.",
                    "error_code": "RIDE_ALREADY_CANCELED"
                },
                {
                    "departure_time": "in_past",
                    "error": "Cannot delete a ride that has already departed.",
                    "error_code": "RIDE_IN_PAST"
                }
            ]
        },
        "cancel": {
            "allowed_if": {
                "departure_time": { "minutes_from_now": { "greater_than": 30 } },
                "status": "active"
            },
            "denied_if": [
                {
                    "status": "canceled",
                    "error": "This ride has already been canceled.",
                    "error_code": "RIDE_ALREADY_CANCELED"
                },
                {
                    "departure_time": "in_past",
                    "error": "Cannot cancel a ride that has already departed.",
                    "error_code": "RIDE_IN_PAST"
                },
                {
                    "departure_time": { "minutes_from_now": { "less_than_or_equal": 30 } },
                    "error": "Cannot cancel a ride less than 30 minutes before departure.",
                    "error_code": "CANCELLATION_TOO_LATE"
                }
            ],
            "post_action": {
                "notify_booked_users": true,
                "change_status_to": "canceled"
            }
        },
        "update": {
            "allowed_if": {
                "status": "active",
                "departure_time": { "minutes_from_now": { "greater_than": 60 } }
            },
            "denied_if": [
                {
                    "status": "canceled",
                    "error": "Cannot update a canceled ride.",
                    "error_code": "RIDE_ALREADY_CANCELED"
                },
                {
                    "departure_time": { "minutes_from_now": { "less_than_or_equal": 60 } },
                    "error": "Cannot update ride details less than 1 hour before departure.",
                    "error_code": "UPDATE_TOO_LATE"
                }
            ]
        }
    },

    "booking": {
        "create": {
            "allowed_if": {
                "ride_status": "active",
                "available_seats": { "greater_than": 0 },
                "departure_time": { "minutes_from_now": { "greater_than": 10 } },
                "user_not_already_booked": true,
                "user_booking_limit_not_reached": true,
                "no_time_conflict": true
            },
            "denied_if": [
                {
                    "ride_status": "canceled",
                    "error": "Cannot book a ride that has been canceled.",
                    "error_code": "RIDE_CANCELED"
                },
                {
                    "available_seats": 0,
                    "error": "Sorry, this ride is fully booked. All seats have been taken.",
                    "error_code": "RIDE_FULLY_BOOKED"
                },
                {
                    "departure_time": "in_past",
                    "error": "Cannot book a ride that has already started.",
                    "error_code": "RIDE_ALREADY_STARTED"
                },
                {
                    "departure_time": { "minutes_from_now": { "less_than_or_equal": 10 } },
                    "error": "Cannot book a ride less than 10 minutes before departure.",
                    "error_code": "BOOKING_TOO_LATE"
                },
                {
                    "user_already_booked": true,
                    "error": "You have already booked this ride.",
                    "error_code": "ALREADY_BOOKED"
                },
                {
                    "user_booking_limit_reached": true,
                    "error": "You have reached the maximum number of active bookings (5). Please cancel an existing booking first.",
                    "error_code": "BOOKING_LIMIT_REACHED"
                },
                {
                    "time_conflict": true,
                    "error": "You already have a ride booked during this time. Please check your existing bookings.",
                    "error_code": "TIME_CONFLICT"
                }
            ]
        },
        "cancel": {
            "allowed_if": {
                "departure_time": { "minutes_from_now": { "greater_than": 30 } },
                "status": "pending",
                "ride_status": "active"
            },
            "denied_if": [
                {
                    "departure_time": { "minutes_from_now": { "less_than_or_equal": 30 } },
                    "error": "You cannot cancel your booking less than 30 minutes before departure.",
                    "error_code": "CANCELLATION_TOO_LATE"
                },
                {
                    "status": "completed",
                    "error": "This booking has already been completed and cannot be canceled.",
                    "error_code": "BOOKING_ALREADY_COMPLETED"
                },
                {
                    "status": "checked-in",
                    "error": "Cannot cancel a booking after check-in. Please contact the agency.",
                    "error_code": "BOOKING_ALREADY_CHECKED_IN"
                },
                {
                    "ride_status": "canceled",
                    "error": "Cannot cancel booking for a ride that has been canceled.",
                    "error_code": "RIDE_CANCELED"
                }
            ],
            "post_action": {
                "free_up_seat": true
            }
        }
    },

    "user_restrictions": {
        "max_active_bookings": {
            "limit": 5,
            "error": "You have reached the maximum number of active bookings (5). Please cancel an existing booking first.",
            "error_code": "BOOKING_LIMIT_REACHED"
        },

        "duplicate_time_conflict": {
            "check": "user_has_booking_same_time",
            "error": "You already have a ride booked during this time. Please check your existing bookings.",
            "error_code": "TIME_CONFLICT"
        },

        "booking_time_limit": {
            "minutes_before_departure": 10,
            "error": "Cannot book a ride less than 10 minutes before departure.",
            "error_code": "BOOKING_TOO_LATE"
        }
    }
};

module.exports = rideRules; 