import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { useFocusEffect } from 'expo-router';
import axios from 'axios';
import { format } from 'date-fns';

export default function MessagesScreen() {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const {
        error: messagesError,
        isLoading: isLoadingMessages,
        execute: fetchMessages,
        retry: retryMessages
    } = useApi(async (pageNum = 1) => {
        const response = await axios.get(
            `${process.env.EXPO_PUBLIC_API_URL}/messages?page=${pageNum}&limit=20`,
            {
                headers: { Authorization: `Bearer ${user.token}` },
            }
        );
        return response.data;
    });

    const {
        error: unreadError,
        execute: fetchUnreadCount,
        retry: retryUnreadCount
    } = useApi(async () => {
        const response = await axios.get(
            `${process.env.EXPO_PUBLIC_API_URL}/messages/unread-count`,
            {
                headers: { Authorization: `Bearer ${user.token}` },
            }
        );
        return response.data;
    });

    const {
        error: markReadError,
        execute: markMessageAsRead,
        retry: retryMarkRead
    } = useApi(async (messageId) => {
        const response = await axios.put(
            `${process.env.EXPO_PUBLIC_API_URL}/messages/${messageId}/read`,
            {},
            {
                headers: { Authorization: `Bearer ${user.token}` },
            }
        );
        return response.data;
    });

    // Use focus effect to refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (user) {
                loadMessages(1);
                loadUnreadCount();
            }
        }, [user])
    );

    useEffect(() => {
        loadMessages();
        loadUnreadCount();
    }, []);

    useEffect(() => {
        if (messagesError) {
            Alert.alert(
                'Error Loading Messages',
                messagesError.userMessage || 'We encountered an error while loading your messages. Please try again.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Retry', onPress: retryMessages }
                ]
            );
        }
    }, [messagesError]);

    useEffect(() => {
        if (unreadError) {
            console.error('Failed to load unread count:', unreadError);
        }
    }, [unreadError]);

    useEffect(() => {
        if (markReadError) {
            Alert.alert(
                'Error',
                markReadError.userMessage || 'Failed to mark message as read.',
                [{ text: 'OK' }]
            );
        }
    }, [markReadError]);

    const loadMessages = async (pageNum = 1) => {
        try {
            const result = await fetchMessages(pageNum);
            if (pageNum === 1) {
                setMessages(result.messages || []);
            } else {
                setMessages(prev => [...prev, ...(result.messages || [])]);
            }
            setHasMore(result.page < result.totalPages);
            setPage(result.page);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const result = await fetchUnreadCount();
            setUnreadCount(result.count || 0);
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    };

    const onRefresh = useCallback(() => {
        setPage(1);
        setHasMore(true);
        loadMessages(1);
        loadUnreadCount();
    }, []);

    const loadMoreMessages = () => {
        if (hasMore && !isLoadingMessages) {
            loadMessages(page + 1);
        }
    };

    const handleMessagePress = async (message) => {
        if (!message.isRead) {
            try {
                await markMessageAsRead(message._id);
                // Update local state
                setMessages(prev =>
                    prev.map(msg =>
                        msg._id === message._id
                            ? { ...msg, isRead: true, readAt: new Date() }
                            : msg
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error('Error marking message as read:', error);
            }
        }
    };

    const getMessageIcon = (type) => {
        switch (type) {
            case 'booking_confirmation':
                return { name: 'check-circle', color: '#4CAF50' };
            case 'booking_cancellation':
                return { name: 'times-circle', color: '#F44336' };
            case 'ride_update':
                return { name: 'edit', color: '#2196F3' };
            case 'ride_cancellation':
                return { name: 'ban', color: '#FF9800' };
            case 'reminder':
                return { name: 'bell', color: '#9C27B0' };
            case 'completion':
                return { name: 'flag-checkered', color: '#607D8B' };
            case 'private_ride_booked':
                return { name: 'user-plus', color: '#4CAF50' };
            case 'private_ride_completed':
                return { name: 'star', color: '#FFC107' };
            default:
                return { name: 'envelope', color: '#757575' };
        }
    };

    const getMessageTypeLabel = (type) => {
        switch (type) {
            case 'booking_confirmation':
                return 'Booking Confirmed';
            case 'booking_cancellation':
                return 'Booking Cancelled';
            case 'ride_update':
                return 'Ride Updated';
            case 'ride_cancellation':
                return 'Ride Cancelled';
            case 'reminder':
                return 'Ride Reminder';
            case 'completion':
                return 'Ride Completed';
            case 'private_ride_booked':
                return 'New Passenger';
            case 'private_ride_completed':
                return 'Ride Completed';
            default:
                return 'Message';
        }
    };

    const renderMessage = ({ item }) => {
        const icon = getMessageIcon(item.type);
        const typeLabel = getMessageTypeLabel(item.type);

        return (
            <TouchableOpacity
                style={[
                    styles.messageCard,
                    !item.isRead && styles.unreadMessage
                ]}
                onPress={() => handleMessagePress(item)}
            >
                <View style={styles.messageHeader}>
                    <View style={styles.messageIconContainer}>
                        <FontAwesome5 name={icon.name} size={16} color={icon.color} />
                    </View>
                    <View style={styles.messageInfo}>
                        <Text style={styles.messageTitle}>{item.title}</Text>
                        <Text style={styles.messageType}>{typeLabel}</Text>
                    </View>
                    <View style={styles.messageMeta}>
                        {!item.isRead && <View style={styles.unreadDot} />}
                        <Text style={styles.messageTime}>
                            {format(new Date(item.created_at), 'MMM dd, HH:mm')}
                        </Text>
                    </View>
                </View>
                <Text style={styles.messageContent} numberOfLines={3}>
                    {item.content}
                </Text>
                {item.rideId && (
                    <View style={styles.rideInfo}>
                        <FontAwesome5 name="route" size={12} color="#666" />
                        <Text style={styles.rideText}>
                            {item.rideId.from} → {item.rideId.to}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <FontAwesome5 name="envelope-open" size={48} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Messages Yet</Text>
            <Text style={styles.emptyStateText}>
                You'll receive notifications here when you book rides, get updates, or receive reminders.
            </Text>
        </View>
    );

    return (
        <LinearGradient
            colors={['#0a2472', '#1E90FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.backgroundGradient}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Messages</Text>
                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>

                <FlatList
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item._id}
                    style={styles.messageList}
                    contentContainerStyle={styles.messageListContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoadingMessages && page === 1}
                            onRefresh={onRefresh}
                            tintColor="#fff"
                        />
                    }
                    onEndReached={loadMoreMessages}
                    onEndReachedThreshold={0.1}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                />
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
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    unreadBadge: {
        backgroundColor: '#FF5722',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    messageList: {
        flex: 1,
    },
    messageListContent: {
        padding: 20,
        paddingBottom: 100,
    },
    messageCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    unreadMessage: {
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
        backgroundColor: '#f8f9ff',
    },
    messageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    messageIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    messageInfo: {
        flex: 1,
    },
    messageTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    messageType: {
        fontSize: 12,
        color: '#666',
    },
    messageMeta: {
        alignItems: 'flex-end',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2196F3',
        marginBottom: 4,
    },
    messageTime: {
        fontSize: 11,
        color: '#999',
    },
    messageContent: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        marginBottom: 8,
    },
    rideInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    rideText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 6,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
}); 