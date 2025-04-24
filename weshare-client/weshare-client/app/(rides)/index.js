// app/(rides)/index.js
import { View, Text, FlatList, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import RideCard from '../../components/RideCard';
import { useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}


export default function RidesScreen() {
    const router = useRouter();
    const { rides: ridesParam } = useLocalSearchParams();
    const [rides, setRides] = useState(ridesParam ? JSON.parse(ridesParam) : []);
    const [loading, setLoading] = useState(true);
    const [expandedDates, setExpandedDates] = useState(null);

    

    
    useEffect(() => {
        try {
            if (ridesParam) {
                const parsed = JSON.parse(ridesParam);
                if (parsed.length > 0) {
                setRides(parsed);
                setLoading(false);
            } else {
                    fetchRides();
                }
            } else {
                fetchRides();
            }
        } catch (error) {
            console.error('Error fetching rides in index.js of (rides):', error);
            setRides([]);
            setLoading(false);
        }
    }, [ridesParam]);

    const fetchRides = async () => {
        try {
            const response = await axios.get('http://10.48.21.202:5002/api/rides');
            setRides(response.data);
        } catch (error) {
            console.error('Error fetching rides in index.js of (rides):', error);
        }
    };
    const groupRidesByDate = (rides) => {
        const grouped = {};
        rides.forEach(ride => {
            const date = new Date(ride.departure_time).toISOString().split('T')[0]; // 'YYYY-MM-DD'
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(ride);
        });
        return Object.entries(grouped).map(([date, ridesForDate]) => {
            const times = ridesForDate.map(r =>
                new Date(r.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            );
            const sorted = times.sort();
            return { date, rides: ridesForDate, timeRange: `${sorted[0]} - ${sorted[sorted.length - 1]}` };
        });
    };
    const toggleDate = (date) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedDates(prev => (prev === date ? null : date));
    };



    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading rides...</Text>
        </View>
    );
}

    const groupedRides = groupRidesByDate(rides);

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <FlatList
                data={groupedRides}
                keyExtractor={item => item.date}
                renderItem={({ item }) => (
                    <View style={{ marginBottom: 16, backgroundColor: '#dfe3f0', padding: 16, borderRadius: 12 }}>
                        <TouchableOpacity onPress={() => toggleDate(item.date)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <FontAwesome5 name="calendar-alt" size={18} color="black" style={{ marginRight: 8 }} />
                                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.date}</Text>
                                </View>
                                <Text style={{ color: 'gray' }}>{item.timeRange}</Text>
                            </View>
                        </TouchableOpacity>

                        {expandedDates === item.date && (
                            <View style={{ marginTop: 16 }}>
                                {item.rides.map(ride => (
                                    <RideCard
                                        key={ride._id}
                                        ride={ride}
                                        onPress={() => router.push(`/(rides)/${ride._id}`)}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={{ textAlign: 'center', marginTop: 24 }}>
                        No rides available
                    </Text>
                }
            />
        </View>
    );
}
