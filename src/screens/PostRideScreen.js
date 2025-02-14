import React, { useState } from 'react';
import { View, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PostRideForm from '../components/PostRideForm';
import axios from 'axios';

export default function PostRideScreen() {
    const navigation = useNavigation();
    const baseUrl = 'http://10.48.96.152:4000';

    const handleSubmit = async (rideData) => {
        try {
            const token = await AsyncStorage.getItem('token');

            if (!token) {
                Alert.alert(
                    "Authentication Required",
                    "Please login to post a ride",
                    [{ text: "OK", onPress: () => navigation.navigate('Login') }]
                );
                return;
            }

            const response = await axios.post(`${baseUrl}/rides/post`, rideData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert("Success", "Ride posted successfully!");
            navigation.navigate('Home');
        } catch (error) {
            console.error("Error posting ride:", error.response?.data || error.message);
            const errorMessage = error.response?.status === 403
                ? "Your session has expired. Please login again."
                : "Failed to post ride. Please try again.";
            Alert.alert("Error", errorMessage);

            if (error.response?.status === 403) {
                navigation.navigate('Login');
            }
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
        >
                <PostRideForm onSubmit={handleSubmit} />
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}