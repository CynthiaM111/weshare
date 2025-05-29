// components/SplashScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SplashScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>WeShare</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'royalblue',
        width: '100%',
    },
    text: {
        fontSize: 40,
        fontWeight: 'bold',
        color: 'white',
    },
});

export default SplashScreen;