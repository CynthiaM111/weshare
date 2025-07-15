import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ScrollView
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CustomAlert from './CustomAlert';

const DriverContactModal = ({
    visible,
    onClose,
    onConfirmPayment,
    rideDetails,
    driverInfo
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

    const handleConfirmPayment = () => {
        showAlert(
            'Ready to Book',
            'Make sure you have your MTN Mobile Money confirmation message ready, or have the cash amount with you. The driver will verify your payment before boarding.',
            'info',
            [
                {
                    text: 'OK',
                    onPress: () => {
                        setAlertVisible(false);
                        onConfirmPayment();
                    },
                    style: 'default'
                }
            ]
        );
    };

    const handleClose = () => {
        onClose();
    };

    if (!driverInfo) {
        return null;
    }

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
                        <Text style={styles.headerTitle}>Payment Instructions</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <FontAwesome5 name="times" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Driver Info Card */}
                        <View style={styles.driverCard}>
                            <View style={styles.driverHeader}>
                                <FontAwesome5 name="user-circle" size={40} color="#0a2472" />
                                <View style={styles.driverInfo}>
                                    <Text style={styles.driverName}>{driverInfo.name}</Text>
                                    <Text style={styles.driverLabel}>Driver</Text>
                                </View>
                            </View>
                            <View style={styles.contactInfo}>
                                <FontAwesome5 name="phone" size={16} color="#4CAF50" />
                                <Text style={styles.phoneNumber}>{driverInfo.contact_number}</Text>
                            </View>
                        </View>

                        {/* Payment Instructions */}
                        <View style={styles.instructionsCard}>
                            <Text style={styles.instructionsTitle}>Choose Your Payment Method</Text>

                            <View style={styles.paymentOption}>
                                <FontAwesome5 name="mobile-alt" size={24} color="#4CAF50" />
                                <View style={styles.paymentText}>
                                    <Text style={styles.paymentTitle}>MTN Mobile Money</Text>
                                    <Text style={styles.paymentDescription}>
                                        Send <Text style={styles.highlightAmount}>${rideDetails.price}</Text> to <Text style={styles.highlightPhone}>{driverInfo.contact_number}</Text>
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.paymentDivider}>
                                <Text style={styles.dividerText}>OR</Text>
                            </View>

                            <View style={styles.paymentOption}>
                                <FontAwesome5 name="money-bill-wave" size={24} color="#FF9800" />
                                <View style={styles.paymentText}>
                                    <Text style={styles.paymentTitle}>Cash Payment</Text>
                                    <Text style={styles.paymentDescription}>
                                        Have <Text style={styles.highlightAmount}>${rideDetails.price}</Text> ready in cash
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.importantNote}>
                                <FontAwesome5 name="exclamation-triangle" size={16} color="#FF9800" />
                                <Text style={styles.noteText}>
                                    Show payment proof or pay cash before boarding
                                </Text>
                            </View>
                        </View>

                        {/* Ride Details */}
                        <View style={styles.rideCard}>
                            <Text style={styles.rideTitle}>Ride Details</Text>
                            <View style={styles.rideInfo}>
                                <View style={styles.rideRow}>
                                    <FontAwesome5 name="route" size={16} color="#666" />
                                    <Text style={styles.rideText}>{rideDetails.from} → {rideDetails.to}</Text>
                                </View>
                                <View style={styles.rideRow}>
                                    <FontAwesome5 name="calendar" size={16} color="#666" />
                                    <Text style={styles.rideText}>{rideDetails.departureDate}</Text>
                                </View>
                                <View style={styles.rideRow}>
                                    <FontAwesome5 name="dollar-sign" size={16} color="#666" />
                                    <Text style={styles.rideText}>${rideDetails.price} per seat</Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={handleConfirmPayment}
                        >
                            <LinearGradient
                                colors={['#4CAF50', '#45a049']}
                                style={styles.confirmButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <FontAwesome5 name="check" size={16} color="#fff" />
                                <Text style={styles.confirmButtonText}>Finish Booking</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
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
    driverCard: {
        backgroundColor: '#f8f9fa',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    driverHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    driverInfo: {
        marginLeft: 12,
        flex: 1,
    },
    driverName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    driverLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    contactInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
    },
    phoneNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    instructionsCard: {
        backgroundColor: '#fff3cd',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ffeaa7',
        marginBottom: 20,
    },
    instructionsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#856404',
        marginBottom: 16,
    },
    instructionStep: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#856404',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    stepNumberText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    instructionText: {
        fontSize: 14,
        color: '#856404',
        flex: 1,
        lineHeight: 20,
    },
    amount: {
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    rideCard: {
        backgroundColor: '#f8f9fa',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    rideTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    rideInfo: {
        gap: 8,
    },
    rideRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rideText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    noticeCard: {
        flexDirection: 'row',
        backgroundColor: '#fff3e0',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ffcc02',
        alignItems: 'flex-start',
    },
    noticeText: {
        fontSize: 14,
        color: '#e65100',
        marginLeft: 12,
        flex: 1,
        lineHeight: 20,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    confirmButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    confirmButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    paymentText: {
        marginLeft: 16,
        flex: 1,
    },
    paymentTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    paymentDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    paymentDivider: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF9800',
    },
    importantNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff3e0',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ffcc02',
        marginTop: 16,
    },
    noteText: {
        fontSize: 14,
        color: '#e65100',
        marginLeft: 12,
        flex: 1,
        lineHeight: 20,
    },
    highlightAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
        backgroundColor: '#e8f5e8',
        paddingHorizontal: 4,
        borderRadius: 4,
    },
    highlightPhone: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0a2472',
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 4,
        borderRadius: 4,
    },
});

export default DriverContactModal; 