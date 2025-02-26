import React, { useState } from 'react';
import { View } from 'react-native';
import HomeStyles from '../styles/HomeStyles';
import { Input, Button } from '@ui-kitten/components';
import moment from 'moment';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export default function SearchBar({ onSearch }) {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [departureDate, setDepartureDate] = useState(moment());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleSearch = () => {
        const formattedDate = departureDate.format('YYYY-MM-DD');
        onSearch({ from, to, departureDate: formattedDate });
    };
   
    const handleDateConfirm = (selectedDate) => {
        setShowDatePicker(false);
        setDepartureDate(moment(selectedDate));
    };
    const handleDateCancel = () => {
        setShowDatePicker(false);
    };
    return (
        <View style={HomeStyles.searchBox}>
            {/* Inputs for "From" and "To" */}
            <View style={HomeStyles.inputContainer}>
                <Input
                    placeholder="From..."
                    style={HomeStyles.input}
                    value={from}
                    onChangeText={setFrom}
                />
                <Input
                    placeholder="To..."
                    style={HomeStyles.input}
                    value={to}
                    onChangeText={setTo}
                />
            </View>

            {/* UI Kitten Datepicker */}
            <Input
                placeholder="Select Date"
                value={departureDate.format('YYYY-MM-DD')}
                onChangeText={setDepartureDate}
                style={HomeStyles.datePicker}
                onPress={() => setShowDatePicker(true)}
            />
            
            <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                date={departureDate.toDate()}
                onConfirm={handleDateConfirm}
                onCancel={handleDateCancel}
            />
            {/* Search Button */}
            <Button 
            appearance="filled"
            status="basic"
            style={HomeStyles.searchButton} 
            onPress={handleSearch}>
                Search
            </Button>
        </View>
    );
   
}
