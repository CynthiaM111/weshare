import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ScrollView,
    Alert
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import CustomAlert from './CustomAlert';

const DriverRideDetail = ({
    visible,
    onClose,
    ride,
    onUpdatePaymentStatus
}) => {
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        type: 'info',
        buttons: []
    });

    const showAlert = (title, message, type = 'info', buttons = []) => {
        setAlertConfig({ title, message, type, buttons });
        setAlertVisible(true);
    };

    const handlePaymentToggle = (passengerId, currentStatus) => {
        const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
        const action = newStatus === 'paid' ? 'mark as paid' : 'mark as unpaid';

        showAlert(
            'Update Payment Status',
            `Are you sure you want to ${action} for this passenger?`,
            'info',
            [
                {
                    text: 'Cancel',
                    onPress: () => setAlertVisible(false),
                    style: 'cancel'
                },
                {
                    text: 'Confirm',
                    onPress: () => {
                        setAlertVisible(false);
                        onUpdatePaymentStatus(passengerId, newStatus);
                    },
                    style: 'default'
                }
            ]
        );
    };

    const handleClose = () => {
        onClose();
    };

    if (!ride) {
        return null;
    }

    const paidPassengers = ride.bookedBy?.filter(passenger => passenger.paymentStatus === 'paid') || [];
    const unpaidPassengers = ride.bookedBy?.filter(passenger => passenger.paymentStatus !== 'paid') || [];
    const totalPassengers = ride.bookedBy?.length || 0;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Ride Details</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <FontAwesome5 name="times" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Ride Summary */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Ride Summary</Text>
                            <View style={styles.summaryRow}>
                                <FontAwesome5 name="route" size={16} color="#0a2472" />
                                <Text style={styles.summaryText}>{ride.from} → {ride.to}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <FontAwesome5 name="calendar" size={16} color="#0a2472" />
                                <Text style={styles.summaryText}>
                                    {format(new Date(ride.departure_time), 'MMM dd, yyyy')}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <FontAwesome5 name="clock" size={16} color="#0a2472" />
                                <Text style={styles.summaryText}>
                                    {format(new Date(ride.departure_time), 'h:mm a')}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <FontAwesome5 name="dollar-sign" size={16} color="#0a2472" />
                                <Text style={styles.summaryText}>${ride.price} per seat</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <FontAwesome5 name="users" size={16} color="#0a2472" />
                                <Text style={styles.summaryText}>
                                    {totalPassengers} passenger{totalPassengers !== 1 ? 's' : ''} booked
                                </Text>
                            </View>
                        </View>

                        {/* Payment Status Overview */}
                        <View style={styles.paymentOverview}>
                            <View style={styles.paymentStat}>
                                <Text style={styles.paymentStatNumber}>{paidPassengers.length}</Text>
                                <Text style={styles.paymentStatLabel}>Paid</Text>
                            </View>
                            <View style={styles.paymentStat}>
                                <Text style={styles.paymentStatNumber}>{unpaidPassengers.length}</Text>
                                <Text style={styles.paymentStatLabel}>Unpaid</Text>
                            </View>
                            <View style={styles.paymentStat}>
                                <Text style={styles.paymentStatNumber}>
                                    {totalPassengers > 0 ? Math.round((paidPassengers.length / totalPassengers) * 100) : 0}%
                                </Text>
                                <Text style={styles.paymentStatLabel}>Paid</Text>
                            </View>
                        </View>

                        {/* Passengers List */}
                        <View style={styles.passengersSection}>
                            <Text style={styles.sectionTitle}>Passengers</Text>

                            {ride.bookedBy && ride.bookedBy.length > 0 ? (
                                ride.bookedBy.map((passenger, index) => (
                                    <View key={passenger.userId._id || index} style={styles.passengerCard}>
                                        <View style={styles.passengerInfo}>
                                            <View style={styles.passengerAvatar}>
                                                {passenger.userId.photoUrl ? (
                                                    <FontAwesome5 name="user-circle" size={24} color="#0a2472" />
                                                ) : (
                                                    <Text style={styles.passengerInitials}>
                                                        {passenger.userId.name ? passenger.userId.name.charAt(0).toUpperCase() : 'P'}
                                                    </Text>
                                                )}
                                            </View>
                                            <View style={styles.passengerDetails}>
                                                <Text style={styles.passengerName}>
                                                    {passenger.userId.name || 'Passenger'}
                                                </Text>
                                                <Text style={styles.passengerEmail}>
                                                    {passenger.userId.email}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.paymentStatus}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.paymentToggle,
                                                    passenger.paymentStatus === 'paid' ? styles.paidToggle : styles.unpaidToggle
                                                ]}
                                                onPress={() => handlePaymentToggle(
                                                    passenger.userId._id,
                                                    passenger.paymentStatus
                                                )}
                                            >
                                                <FontAwesome5
                                                    name={passenger.paymentStatus === 'paid' ? 'check' : 'times'}
                                                    size={14}
                                                    color={passenger.paymentStatus === 'paid' ? '#fff' : '#666'}
                                                />
                                                <Text style={[
                                                    styles.paymentToggleText,
                                                    passenger.paymentStatus === 'paid' ? styles.paidToggleText : styles.unpaidToggleText
                                                ]}>
                                                    {passenger.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.noPassengers}>
                                    <FontAwesome5 name="users" size={32} color="#ccc" />
                                    <Text style={styles.noPassengersText}>No passengers booked yet</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </View>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                buttons={alertConfig.buttons}
                onDismiss={() => setAlertVisible(false)}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    content: {
        padding: 20,
    },
    summaryCard: {
        backgroundColor: '#f8f9fa',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
        flex: 1,
    },
    paymentOverview: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    paymentStat: {
        alignItems: 'center',
    },
    paymentStatNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0a2472',
    },
    paymentStatLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    passengersSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    passengerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    passengerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    passengerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    passengerInitials: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0a2472',
    },
    passengerDetails: {
        flex: 1,
    },
    passengerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    passengerEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    paymentStatus: {
        marginLeft: 12,
    },
    paymentToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    paidToggle: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    unpaidToggle: {
        backgroundColor: '#fff',
        borderColor: '#ddd',
    },
    paymentToggleText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    paidToggleText: {
        color: '#fff',
    },
    unpaidToggleText: {
        color: '#666',
    },
    noPassengers: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
    },
    noPassengersText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
    },
});

export default DriverRideDetail; 