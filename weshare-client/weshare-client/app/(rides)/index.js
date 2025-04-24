// app/(rides)/index.js
import { View, Text, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import RideCard from '../../components/RideCard';

export default function RidesScreen() {
    const router = useRouter();
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRides();
    }, []);

    const fetchRides = async () => {
        try {
            const response = await axios.get('http://10.48.21.202:5002/api/rides');
            setRides(response.data);
        } catch (error) {
            console.error('Error fetching rides in index.js of (rides):', error);
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
                        onPress={() => router.push(`/(rides)/${item._id}`)}
                    />
                )}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    <Text style={{ textAlign: 'center', marginTop: 24 }}>
                        No rides available
                    </Text>
                }
            />
        </View>
    );
}