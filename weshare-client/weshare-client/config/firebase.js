import { getApp } from '@react-native-firebase/app';
import { getStorage } from '@react-native-firebase/storage';

// React Native Firebase is configured via google-services.json (Android) and GoogleService-Info.plist (iOS)
// No manual configuration needed in the code

// Add error handling for Firebase initialization
let firebaseStorage;
try {
    const app = getApp();
    firebaseStorage = getStorage(app);
} catch (error) {
    // Provide a fallback or mock storage
    firebaseStorage = null;
}

// Export the storage function directly
export const getStorageInstance = () => {
    if (firebaseStorage) {
        return firebaseStorage;
    }
    throw new Error('Firebase Storage is not available');
};

export default firebaseStorage; 