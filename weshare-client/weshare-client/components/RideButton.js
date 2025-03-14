// components/RideButton.js
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/HomeScreenStyles';

export default function RideButton({ title, subtitle, isPublic }) {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                isPublic ? styles.publicButton : styles.privateButton,
            ]}
        >
            <Text style={styles.buttonText}>{title}</Text>
            <Text style={styles.buttonSubText}>{subtitle}</Text>
        </TouchableOpacity>
    );
}