import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

// Import translation files
import en from './locales/en.json';
import kin from './locales/kin.json';

const resources = {
    en: {
        translation: en,
    },
    kin: {
        translation: kin,
    },
};

// Get the device locale
const getDeviceLocale = () => {
    const locales = RNLocalize.getLocales();
    const deviceLanguage = locales[0]?.languageCode;

    // Check if device language is supported
    if (deviceLanguage === 'rw' || deviceLanguage === 'kin') {
        return 'kin';
    }

    // Default to English for other languages
    return 'en';
};

// Get stored language preference or use device locale
const getStoredLanguage = () => {
    try {
        // You can use AsyncStorage here to persist language preference
        // For now, we'll use device locale
        return getDeviceLocale();
    } catch (error) {
        console.log('Error getting stored language:', error);
        return 'en';
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: getStoredLanguage(), // Default language
        fallbackLng: 'en',
        debug: __DEV__, // Enable debug in development

        interpolation: {
            escapeValue: false, // React already escapes values
        },

        react: {
            useSuspense: false, // Disable Suspense for React Native
        },
    });

export default i18n; 