import { StyleSheet } from 'react-native';

const PostRideStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        marginTop: 100,
    },
    input: {
        height: 55,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    button: {
        borderColor: '#f2f230',
        backgroundColor: '#f2f230',
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
    },
    buttonText: {
        color: '#0e2439',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: '#333',
        fontWeight: '500',
    },
    dateTimeContainer: {
        marginBottom: 15,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        marginTop: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    }
});

export default PostRideStyles;
