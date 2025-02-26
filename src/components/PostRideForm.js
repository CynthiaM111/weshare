import React, { useState } from 'react';
import { Layout, Text, Input, Button } from '@ui-kitten/components';
import { Alert } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PostRideStyles from '../styles/PostRideStyles';

const PostRideForm = ({ onSubmit }) => {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [selectedDate, setSelectedDate] = useState(moment());
    const [selectedTime, setSelectedTime] = useState(moment());
    const [seats, setSeats] = useState('');
    const [price, setPrice] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const navigation = useNavigation();

    const handleSubmit = () => {
        if (!from || !to || !selectedDate || !selectedTime || !seats || !price) {
            let missingFields = [];
            if (!from) missingFields.push('"From"');
            if (!to) missingFields.push('"To"');
            if (!selectedDate) missingFields.push('"Departure Date"');
            if (!selectedTime) missingFields.push('"Departure Time"');
            if (!seats) missingFields.push('"Available Seats"');
            if (!price) missingFields.push('"Price"');
            Alert.alert('Missing Fields', `Please fill in the following field(s): ${missingFields.join(', ')}.`);
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
            departureDate: selectedDate.format('YYYY-MM-DD'),
            availableSeats: parseInt(seats),
            price: parseFloat(price)
        });
    };

    const onDateChange = (selectedDate) => {
        setShowDatePicker(false);
        setSelectedDate(moment(selectedDate));
    };

    const onTimeChange = (selectedTime) => {
        setShowTimePicker(false);
        setSelectedTime(moment(selectedTime));
    };

    const handleDateCancel = () => {
        setShowDatePicker(false);

    };

    const handleTimeCancel = () => {
        setShowTimePicker(false);
        setShowDatePicker(false);
    };
    const formatTime = (momentObj) => {
        return momentObj.format('HH:mm');
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
                value={selectedDate.format('YYYY-MM-DD')}
                onFocus={() => setShowDatePicker(true)}
            />
            <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                date={selectedDate.toDate()}
                onConfirm={onDateChange}
                onCancel={handleDateCancel}
            />
            <Input
                style={PostRideStyles.input}
                placeholder="Departure Time"
                value={formatTime(selectedTime)} // Display time in 24-hour format
                onFocus={() => setShowTimePicker(true)}
            />
            <DateTimePickerModal
                isVisible={showTimePicker}
                mode="time"
                date={selectedTime.toDate()}
                onConfirm={onTimeChange}
                onCancel={handleTimeCancel}
                is24Hour={true} // Use 24-hour format
            />
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