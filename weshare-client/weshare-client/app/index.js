// app/index.js
import { View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/HomeScreenStyles';
import RideButton from '../components/RideButton';
import QuickOption from '../components/QuickOptions';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />

      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RideShare</Text>
        <Text style={styles.headerSubtitle}>Your journey starts here</Text>
      </View>

      {/* Main Action Buttons */}
      <View style={styles.buttonContainer}>
        <RideButton
          title="Public Ride"
          subtitle="Join others, save more"
          isPublic={true}
        />
        <RideButton
          title="Private Ride"
          subtitle="Your personal journey"
          isPublic={false}
        />
      </View>

      {/* Quick Options */}
      <View style={styles.quickOptions}>
        <QuickOption label="Schedule" />
        <QuickOption label="History" />
        <QuickOption label="Profile" />
      </View>
    </SafeAreaView>
  );
}