// styles/HomeScreenStyles.js
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        padding: 20,
        backgroundColor: '#4CAF50',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#E8F5E9',
    },
    buttonContainer: {
        padding: 20,
        gap: 15,
    },
    button: {
        padding: 20,
        borderRadius: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    publicButton: {
        backgroundColor: '#2196F3',
    },
    privateButton: {
        backgroundColor: '#FF9800',
    },
    buttonText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    buttonSubText: {
        fontSize: 14,
        color: '#E3F2FD',
        marginTop: 5,
    },
    quickOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: 'auto',
    },
    optionButton: {
        padding: 10,
        backgroundColor: '#E8ECEF',
        borderRadius: 10,
    },
    optionText: {
        fontSize: 16,
        color: '#2C3E50',
        fontWeight: '500',
    },
});