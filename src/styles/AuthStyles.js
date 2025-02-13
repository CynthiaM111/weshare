import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    input: {
        marginBottom: 10,
        marginTop: 10,
        gap: 15,
        display: 'flex',
        flexDirection: 'column',
    },
    button: {
        marginTop: 10,
        paddingVertical: 18,
        paddingHorizontal: 10,
        borderRadius: 15,
        backgroundColor: '#f2f230',
        alignItems: 'center',
        borderColor: '#f2f230',
    },
    buttonText: {
        color: '#0e2439',
        fontSize: 20,
        fontWeight: 'bold',
    },
    error: {
        color: 'red',
        marginBottom: 10,
    },
    success: {
        color: 'green',
        marginBottom: 10,
    },
});