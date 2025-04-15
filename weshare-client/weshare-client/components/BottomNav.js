// app/_components/BottomNav.js
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function BottomNav({ activeTab, setActiveTab }) {
    return (
        <View style={styles.bottomNav}>
            <TouchableOpacity
                style={styles.navItem}
                onPress={() => setActiveTab('Home')}
            >
                <Ionicons
                    name="home-outline"
                    size={24}
                    color={activeTab === 'Home' ? '#4CAF50' : '#000'}
                />
                <Text style={[
                    styles.navText,
                    { color: activeTab === 'Home' ? '#4CAF50' : '#000' }
                ]}>
                    Home
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.navItem}
                onPress={() => setActiveTab('Rides')}
            >
                <Ionicons
                    name="car-outline"
                    size={24}
                    color={activeTab === 'Rides' ? '#4CAF50' : '#000'}
                />
                <Text style={[
                    styles.navText,
                    { color: activeTab === 'Rides' ? '#4CAF50' : '#000' }
                ]}>
                    Rides
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.navItem}
                onPress={() => setActiveTab('Inbox')}
            >
                <Ionicons
                    name="chatbox-outline"
                    size={24}
                    color={activeTab === 'Inbox' ? '#4CAF50' : '#000'}
                />
                <Text style={[
                    styles.navText,
                    { color: activeTab === 'Inbox' ? '#4CAF50' : '#000' }
                ]}>
                    Inbox
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.navItem}
                onPress={() => setActiveTab('Profile')}
            >
                <Ionicons
                    name="person-outline"
                    size={24}
                    color={activeTab === 'Profile' ? '#4CAF50' : '#000'}
                />
                <Text style={[
                    styles.navText,
                    { color: activeTab === 'Profile' ? '#4CAF50' : '#000' }
                ]}>
                    Profile
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    navItem: {
        alignItems: 'center',
        padding: 5,
    },
    navText: {
        fontSize: 12,
        marginTop: 5,
    },
});