import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { pickImage } from '../utils/photoUpload';

export default function PhotoPicker({ visible, onClose, onPhotoSelected }) {
    const handlePickImage = async () => {
        try {
            const result = await pickImage();
            if (result) {
                onPhotoSelected(result);
            }
            onClose();
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to pick image');
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Choose Photo</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <FontAwesome5 name="times" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.options}>
                        <TouchableOpacity style={styles.option} onPress={handlePickImage}>
                            <View style={styles.optionIcon}>
                                <FontAwesome5 name="images" size={24} color="#667eea" />
                            </View>
                            <Text style={styles.optionText}>Choose from Gallery</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

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
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    closeButton: {
        padding: 5,
    },
    options: {
        gap: 15,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    optionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
    },
    cancelButton: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#dc3545',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#c82333',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
}); 