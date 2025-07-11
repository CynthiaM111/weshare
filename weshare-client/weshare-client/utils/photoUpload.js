import { getStorageInstance } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';

// Temporary fallback for when Firebase is not available
const isFirebaseAvailable = () => {
    try {
        const storage = getStorageInstance();
        return storage !== null && storage !== undefined;
    } catch (error) {
        return false;
    }
};

export const pickImage = async () => {
    try {
        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Permission to access camera roll is required!');
        }

        // Launch image picker with optimized settings for faster upload
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1], // Square aspect ratio for profile photos
            quality: 0.6, // Reduced quality for faster upload
            maxWidth: 400, // Reduced size for faster upload
            maxHeight: 400, // Reduced size for faster upload
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            return result.assets[0];
        }

        return null;
    } catch (error) {
        console.error('Error picking image:', error);
        throw error;
    }
};

export const takePhoto = async () => {
    try {
        // Request permissions
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Permission to access camera is required!');
        }

        // Launch camera with optimized settings for faster upload
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1], // Square aspect ratio for profile photos
            quality: 0.6, // Reduced quality for faster upload
            maxWidth: 400, // Reduced size for faster upload
            maxHeight: 400, // Reduced size for faster upload
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            return result.assets[0];
        }

        return null;
    } catch (error) {
        console.error('Error taking photo:', error);
        throw error;
    }
};

export const uploadProfilePhoto = async (uri, userId) => {
    try {
        // Check if Firebase storage is available
        if (!isFirebaseAvailable()) {
            // Return the local URI as a temporary solution
            return uri;
        }

        const storage = getStorageInstance();

        // Create a unique filename
        const filename = `profile-photos/${userId}/${Date.now()}.jpg`;
        const storageRef = storage.ref(filename);

        // Upload file to Firebase Storage
        const uploadTask = await storageRef.putFile(uri);

        // Get download URL
        const downloadURL = await storageRef.getDownloadURL();

        return downloadURL;
    } catch (error) {
        // Fallback to local URI if Firebase fails
        return uri;
    }
};

export const deleteProfilePhoto = async (photoURL) => {
    try {
        if (!photoURL || !isFirebaseAvailable()) return;

        const storage = getStorageInstance();

        // Extract the path from the URL
        const urlParts = photoURL.split('/');
        const filename = urlParts[urlParts.length - 1];
        const userId = urlParts[urlParts.length - 2];
        const fullPath = `profile-photos/${userId}/${filename}`;

        const storageRef = storage.ref(fullPath);
        await storageRef.delete();
    } catch (error) {
        // Don't throw error for deletion failures as it's not critical
    }
}; 