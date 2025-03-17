// styles/HomeScreenStyles.js
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    notificationIcon: {
        padding: 5,
    },
    searchContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
    },
    searchLabel: {
        fontSize: 16,
        marginBottom: 5,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 15,
        marginBottom: 15,
        
        
    },
    optionalFields: {
        marginBottom: 20,
    },
    optionalLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    optionalInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 15,
        marginBottom: 10,
       
    },
    optionsContainer: {
        marginBottom: 20,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    optionText: {
        marginLeft: 10,
        fontSize: 16,
    },
    findButton: {
        backgroundColor: '#0a2472',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    findButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
        backgroundColor: '#fff',
       
    },
    navItem: {
        alignItems: 'center',
        paddingBottom: 10,
    },
    navText: {
        fontSize: 16,
        marginTop: 5,
    },
});