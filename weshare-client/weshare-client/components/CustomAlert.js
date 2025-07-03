import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Animated,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CustomAlert = ({
    visible,
    title,
    message,
    type = 'info', // 'success', 'error', 'warning', 'info'
    buttons = [],
    onDismiss,
    showIcon = true,
}) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Simple fade in
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();

            // Simple scale in
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }).start();
        } else {
            // Simple fade out
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start();

            // Simple scale out
            Animated.spring(scaleAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }).start();
        }
    }, [visible]);

    const getTypeConfig = () => {
        switch (type) {
            case 'success':
                return {
                    colors: ['#4CAF50', '#45a049'],
                    icon: 'checkmark-circle',
                    iconColor: '#fff',
                };
            case 'error':
                return {
                    colors: ['#f44336', '#d32f2f'],
                    icon: 'close-circle',
                    iconColor: '#fff',
                };
            case 'warning':
                return {
                    colors: ['#ff9800', '#f57c00'],
                    icon: 'warning',
                    iconColor: '#fff',
                };
            case 'info':
            default:
                return {
                    colors: ['#0a2472', '#1E90FF'],
                    icon: 'information-circle',
                    iconColor: '#fff',
                };
        }
    };

    const typeConfig = getTypeConfig();

    const handleButtonPress = (button) => {
        if (button.onPress) {
            button.onPress();
        }
        if (onDismiss) {
            onDismiss();
        }
    };

    const renderButtons = () => {
        if (buttons.length === 0) {
            return (
                <TouchableOpacity
                    style={styles.singleButton}
                    onPress={() => handleButtonPress({})}
                >
                    <LinearGradient
                        colors={typeConfig.colors}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.buttonText}>OK</Text>
                    </LinearGradient>
                </TouchableOpacity>
            );
        }

        if (buttons.length === 1) {
            return (
                <TouchableOpacity
                    style={styles.singleButton}
                    onPress={() => handleButtonPress(buttons[0])}
                >
                    <LinearGradient
                        colors={typeConfig.colors}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.buttonText}>{buttons[0].text}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            );
        }

        return (
            <View style={styles.buttonRow}>
                {buttons.map((button, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.multiButton,
                            index === 0 && styles.firstButton,
                            index === buttons.length - 1 && styles.lastButton,
                        ]}
                        onPress={() => handleButtonPress(button)}
                    >
                        <LinearGradient
                            colors={button.style === 'cancel' ? ['#6c757d', '#5a6268'] : typeConfig.colors}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.buttonText}>{button.text}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    if (!visible) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onDismiss}
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.overlayTouchable}
                    activeOpacity={1}
                    onPress={onDismiss}
                >
                    <Animated.View
                        style={[
                            styles.alertContainer,
                            {
                                opacity: opacityAnim,
                                transform: [{ scale: scaleAnim }],
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={typeConfig.colors}
                            style={styles.headerGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {showIcon && (
                                <View style={styles.iconContainer}>
                                    <Ionicons
                                        name={typeConfig.icon}
                                        size={32}
                                        color={typeConfig.iconColor}
                                    />
                                </View>
                            )}
                            <Text style={styles.title}>{title}</Text>
                        </LinearGradient>

                        <View style={styles.messageContainer}>
                            <Text style={styles.message}>{message}</Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            {renderButtons()}
                        </View>
                    </Animated.View>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayTouchable: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertContainer: {
        width: width * 0.85,
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    alertContent: {
        flex: 1,
    },
    headerGradient: {
        padding: 20,
        alignItems: 'center',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    iconContainer: {
        marginBottom: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    messageContainer: {
        padding: 20,
        paddingTop: 15,
    },
    message: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonContainer: {
        padding: 20,
        paddingTop: 0,
    },
    singleButton: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    buttonGradient: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    multiButton: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
        marginHorizontal: 5,
    },
    firstButton: {
        marginLeft: 0,
    },
    lastButton: {
        marginRight: 0,
    },
});

export default CustomAlert; 