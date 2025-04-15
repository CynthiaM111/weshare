// app/(rides)/index.js
import { View, Text, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import RideCard from '../../components/RideCard';
import BottomNav from '../../components/BottomNav';

export default function RidesScreen() {
    const [activeTab, setActiveTab] = useState('Rides');
    const router = useRouter();
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRides();
    }, []);

    const fetchRides = async () => {
        try {
            const response = await axios.get('http://localhost:5002/api/rides');
            setRides(response.data);
        } catch (error) {
            console.error('Error fetching rides:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading rides...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={rides}
                renderItem={({ item }) => (
                    <RideCard
                        ride={item}
                        onPress={() => router.push(`/rides/${item._id}`)}
                    />
                )}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: 16 }}
            />
            {/* <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} /> */}
        </View>
    );
}