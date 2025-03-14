// components/QuickOption.js
import { TouchableOpacity, Text } from 'react-native';
import { styles } from '../styles/HomeScreenStyles';

export default function QuickOption({ label }) {
    return (
        <TouchableOpacity style={styles.optionButton}>
            <Text style={styles.optionText}>{label}</Text>
        </TouchableOpacity>
    );
}