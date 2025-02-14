import React, { useState } from 'react';
import { Layout, Text, Input, Button, Alert, StyleSheet } from '@ui-kitten/components';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PostRideStyles from '../styles/PostRideStyles';

const PostRideForm = ({ onSubmit }) => {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [seats, setSeats] = useState('');
    const [price, setPrice] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const navigation = useNavigation();
    const handleSubmit = () => {
        if (!from || !to || !selectedDate || !selectedTime || !seats || !price) {
            Alert.alert('Error', 'All fields are required');
            return;
        }
        if (parseInt(seats) <= 0) {
            Alert.alert('Error', 'Available seats must be greater than 0');
            return;
        }
        if (selectedDate < new Date()) {
            Alert.alert('Error', 'Departure date and time must be in the future');
            return;
        }
        onSubmit({
            from,
            to,
            departureTime: formatTime(selectedTime), // Format time to 24-hour format
            departureDate: selectedDate.toLocaleDateString(),
            availableSeats: parseInt(seats),
            price: parseFloat(price)
        });
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setSelectedDate(selectedDate);
        }
    };

    const onTimeChange = (event, selectedTime) => {
        setShowTimePicker(false);
        if (selectedTime) {
            setSelectedTime(selectedTime);
        }
    };

    // Function to format time in 24-hour format (HH:mm)
    const formatTime = (date) => {
        const hours = date.getHours().toString().padStart(2, '0'); // Ensure 2 digits
        const minutes = date.getMinutes().toString().padStart(2, '0'); // Ensure 2 digits
        return `${hours}:${minutes}`;
    };

    
    return (
        <Layout style={PostRideStyles.container}>
            <Ionicons
                name="arrow-back"
                size={24}
                color="black"
                onPress={() => navigation.goBack()}
                style={{ marginBottom: 10 }}
            />
            <Text style={PostRideStyles.title}>Post Ride</Text>
            <Input
                style={PostRideStyles.input}
                placeholder="From"
                value={from}
                onChangeText={setFrom}
            />
            <Input
                style={PostRideStyles.input}
                placeholder="To"
                value={to}
                onChangeText={setTo}
            />
            <Input
                style={PostRideStyles.input}
                placeholder="Available Seats"
                value={seats}
                onChangeText={setSeats}
                keyboardType="numeric"
            />
            <Input
                style={PostRideStyles.input}
                placeholder="Price"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
            />
            <Input
                style={PostRideStyles.input}
                placeholder="Departure Date"
                value={selectedDate.toLocaleDateString()}
                onFocus={() => setShowDatePicker(true)}
            />
            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}
            <Input
                style={PostRideStyles.input}
                placeholder="Departure Time"
                value={formatTime(selectedTime)} // Display time in 24-hour format
                onFocus={() => setShowTimePicker(true)}
            />
            {showTimePicker && (
                <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    display="default"
                    onChange={onTimeChange}
                    is24Hour={true} // Use 24-hour format
                />
            )}
            <Button 
                onPress={handleSubmit} 
                style={PostRideStyles.button}
                appearance="filled"
                size="large"
                status="basic"
                textStyle={PostRideStyles.buttonText}
            >
                Post Ride
            </Button>
        </Layout>
    );
};

export default PostRideForm;