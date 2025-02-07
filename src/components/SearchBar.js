import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import HomeStyles from '../styles/HomeStyles';

export default function SearchBar() {
    return (
        <View style={HomeStyles.searchBox}>
            <TextInput placeholder="From..." style={HomeStyles.input} />
            <TextInput placeholder="To..." style={HomeStyles.input} />
            <TouchableOpacity style={HomeStyles.searchButton}>
                <Text style={HomeStyles.searchButtonText}>Search</Text>
            </TouchableOpacity>
        </View>
    );
}
