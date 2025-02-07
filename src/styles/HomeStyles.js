import { StyleSheet } from 'react-native';

const HomeStyles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    header: {
        fontSize: 20,
        color: '#0e2439',
        fontFamily: 'KGRedHands',
    },
    postRideButton: {
        backgroundColor: '#0e2439', // Light blue
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    postRideButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'KGRedHands',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        padding: 10,
        marginBottom: 15,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginHorizontal: 5,
        backgroundColor: '#fff',
    },
    searchButton: {
        borderWidth: 1,
        borderColor: '#0e2439', // Bootstrap success green
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    searchButtonText: {
        color: '#0e2439', // Bootstrap success green
        fontSize: 16,
        fontWeight: 'bold',
    },
    rideList: {
        marginTop: 10,
    },
});

export default HomeStyles;
