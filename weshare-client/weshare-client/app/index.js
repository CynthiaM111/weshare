// app/index.js
import { View, Text, StatusBar, TextInput, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { styles } from '../styles/HomeScreenStyles';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('Home');
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />

      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Where to?</Text>
        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>From</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="City, town, address, or place"
        />
        <Text style={styles.searchLabel}>To</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="City, town, address, or place"
        />

        <View style={styles.optionalFields}>
          <Text style={styles.optionalLabel}>Departure date (optional)</Text>
          <TextInput
            style={styles.optionalInput}
            placeholder="MM/DD"
          />

          <Text style={styles.optionalLabel}>Time </Text>
          <TextInput
            style={styles.optionalInput}
            placeholder="HH:MM"
          />
        </View>

        <View style={styles.optionsContainer}>
          <View style={styles.optionRow}>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={"#f4f3f4"}
            />
            <Text style={styles.optionText}>Only show private rides </Text>
          </View>

          <View style={styles.optionRow}>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={"#f4f3f4"}
            />
            <Text style={styles.optionText}>Notify me about new matching rides</Text>
          </View>
        </View>


        <TouchableOpacity style={styles.findButton}>
          <Text style={styles.findButtonText}>Find matching rides</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Home')}>
          <Ionicons name="home-outline" size={24} color={activeTab === 'Home' ? '#4CAF50' : '#000'} />  
          <Text style={[styles.navText, { color: activeTab === 'Home' ? '#4CAF50' : '#000' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Rides')}>
          <Ionicons name="car-outline" size={24} color={activeTab === 'Rides' ? '#4CAF50' : '#000'} />
          <Text style={[styles.navText, { color: activeTab === 'Rides' ? '#4CAF50' : '#000' }]}>Rides</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Inbox')}  >
          <Ionicons name="chatbox-outline" size={24} color={activeTab === 'Inbox' ? '#4CAF50' : '#000'} />
          <Text style={[styles.navText, { color: activeTab === 'Inbox' ? '#4CAF50' : '#000' }]}>Inbox</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Profile')}>
          <Ionicons name="person-outline" size={24} color={activeTab === 'Profile' ? '#4CAF50' : '#000'} />
          <Text style={[styles.navText, { color: activeTab === 'Profile' ? '#4CAF50' : '#000' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}