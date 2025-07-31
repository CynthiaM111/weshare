import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Linking,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function HelpSupportScreen() {
    const router = useRouter();
    const [expandedFAQ, setExpandedFAQ] = useState(null);

    const faqs = [
        {
            id: 1,
            question: "How do I book a ride?",
            answer: "To book a ride, go to the home screen, enter your departure and destination locations, then tap 'Search Rides'. Select an available ride and confirm your booking. You'll receive a confirmation message once booked."
        },
        {
            id: 2,
            question: "How do I cancel a booking?",
            answer: "Go to 'My Rides' in your profile, find the ride you want to cancel, and tap the cancel button. Please note that cancellation policies may apply depending on how close to departure time you cancel."
        },
        {
            id: 3,
            question: "What payment methods are accepted?",
            answer: "We currently accept cash payments and mobile money transfers. Payment is typically made directly to the driver or agency upon boarding the vehicle."
        },
        {
            id: 4,
            question: "How do I know if my ride is confirmed?",
            answer: "You'll receive a confirmation message via SMS and in-app notification once your booking is confirmed. You can also check the status in the 'My Rides' section of your profile."
        },
        {
            id: 5,
            question: "What if my ride is delayed or cancelled?",
            answer: "If there are any changes to your ride schedule, you'll be notified via SMS and in-app messages. You can also contact our support team for assistance."
        },
        {
            id: 6,
            question: "How do I become a driver?",
            answer: "To become a driver, go to your profile and look for the driver verification option. You'll need to provide required documents and complete the verification process."
        },
        {
            id: 7,
            question: "Is my personal information secure?",
            answer: "Yes, we take your privacy seriously. Your personal information is encrypted and stored securely. We only share necessary information with drivers and agencies for ride coordination."
        },
        {
            id: 8,
            question: "What should I do if I have a complaint?",
            answer: "If you have any complaints or issues, please contact our support team using the contact information below. We're here to help resolve any problems you may encounter."
        }
    ];

    const handleCallSupport = () => {
        Alert.alert(
            'Contact Support',
            'Call WeShare Support at +250782186545?\n\nOperating Hours: 9:00 AM - 5:00 PM',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Call Now',
                    onPress: () => Linking.openURL('tel:+250782186545')
                }
            ]
        );
    };

    const toggleFAQ = (id) => {
        setExpandedFAQ(expandedFAQ === id ? null : id);
    };

    const renderFAQ = (faq) => {
        const isExpanded = expandedFAQ === faq.id;

        return (
            <View key={faq.id} style={styles.faqItem}>
                <TouchableOpacity
                    style={styles.faqQuestion}
                    onPress={() => toggleFAQ(faq.id)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.faqQuestionText}>{faq.question}</Text>
                    <FontAwesome5
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#0a2472"
                    />
                </TouchableOpacity>
                {isExpanded && (
                    <View style={styles.faqAnswer}>
                        <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <LinearGradient
            colors={['#0a2472', '#1E90FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.backgroundGradient}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <FontAwesome5 name="arrow-left" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Help & Support</Text>
                    <View style={styles.headerPlaceholder}>
                        <LanguageSwitcher style={styles.languageSwitcher} compact={true} />
                    </View>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Contact Section */}
                    <View style={styles.contactSection}>
                        <View style={styles.sectionHeader}>
                            <FontAwesome5 name="phone" size={24} color="#0a2472" />
                            <Text style={styles.sectionTitle}>Contact Us</Text>
                        </View>

                        <View style={styles.contactCard}>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactLabel}>WeShare Support</Text>
                                <Text style={styles.contactNumber}>+250 782 186 545</Text>
                                <Text style={styles.contactHours}>Available: 9:00 AM - 5:00 PM</Text>
                                <Text style={styles.contactNote}>
                                    Please be patient while waiting for assistance. Our team is here to help you!
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={handleCallSupport}
                                activeOpacity={0.8}
                            >
                                <FontAwesome5 name="phone" size={18} color="#fff" />
                                <Text style={styles.callButtonText}>Call Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* FAQ Section */}
                    <View style={styles.faqSection}>
                        <View style={styles.sectionHeader}>
                            <FontAwesome5 name="question-circle" size={24} color="#0a2472" />
                            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                        </View>

                        <View style={styles.faqContainer}>
                            {faqs.map(renderFAQ)}
                        </View>
                    </View>

                    {/* Additional Support */}
                    <View style={styles.additionalSection}>
                        <View style={styles.sectionHeader}>
                            <FontAwesome5 name="info-circle" size={24} color="#0a2472" />
                            <Text style={styles.sectionTitle}>Additional Information</Text>
                        </View>

                        <View style={styles.infoCard}>
                            <Text style={styles.infoText}>
                                If you can't find the answer to your question in our FAQ, please don't hesitate to call our support team. We're committed to providing you with the best possible service and will do our best to resolve any issues you may have.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    backgroundGradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'rgba(10, 36, 114, 0.8)',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    headerPlaceholder: {
        width: 32,
        height: 32,
    },
    scrollView: {
        flex: 1,
    },
    contactSection: {
        marginBottom: 24,
    },
    faqSection: {
        marginBottom: 24,
    },
    additionalSection: {
        marginBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0a2472',
        marginLeft: 12,
    },
    contactCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    contactInfo: {
        marginBottom: 16,
    },
    contactLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0a2472',
        marginBottom: 4,
    },
    contactNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    contactHours: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 8,
    },
    contactNote: {
        fontSize: 13,
        color: '#64748b',
        fontStyle: 'italic',
        lineHeight: 18,
    },
    callButton: {
        backgroundColor: '#0a2472',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        gap: 8,
    },
    callButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    faqContainer: {
        paddingHorizontal: 20,
    },
    faqItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    faqQuestion: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    faqQuestionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
        marginRight: 12,
        lineHeight: 20,
    },
    faqAnswer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    faqAnswerText: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
        marginTop: 8,
    },
    infoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoText: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
        textAlign: 'center',
    },
}); 