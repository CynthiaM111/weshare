import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesome5 } from '@expo/vector-icons';

const LanguageSwitcher = ({ style = {}, compact = false }) => {
    const { i18n, t } = useTranslation();

    const currentLanguage = i18n.language;
    const isEnglish = currentLanguage === 'en';

    const toggleLanguage = () => {
        const newLanguage = isEnglish ? 'kin' : 'en';
        i18n.changeLanguage(newLanguage);
    };

    if (compact) {
        return (
            <TouchableOpacity
                style={[styles.compactContainer, style]}
                onPress={toggleLanguage}
            >
                <FontAwesome5
                    name="language"
                    size={16}
                    color="#ffffff"
                />
                <Text style={styles.compactLanguageText}>
                    {isEnglish ? 'EN' : 'RW'}
                </Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={toggleLanguage}
        >
            <View style={styles.content}>
                <FontAwesome5
                    name="language"
                    size={16}
                    color="#667eea"
                />
                <Text style={styles.languageText}>
                    {isEnglish ? t('language.kinyarwanda') : t('language.english')}
                </Text>
                <FontAwesome5
                    name="chevron-right"
                    size={12}
                    color="#667eea"
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    languageText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginLeft: 12,
        marginRight: 8,
    },
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    compactLanguageText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        marginLeft: 6,
    },
});

export default LanguageSwitcher; 