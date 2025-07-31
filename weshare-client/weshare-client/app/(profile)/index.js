import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView, Image, Alert, Modal } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
// import ErrorDisplay from '../../components/ErrorDisplay';
import { LinearGradient } from 'expo-linear-gradient';
import PhotoPicker from '../../components/PhotoPicker';
import CustomAlert from '../../components/CustomAlert';
import { uploadProfilePhoto, deleteProfilePhoto } from '../../utils/photoUpload';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function Profile() {
    const { t } = useTranslation();
    const { user, logout, updateUser } = useAuth();
    const router = useRouter();
    const [agencyName, setAgencyName] = useState('');
    const [destinationCategory, setDestinationCategory] = useState('');
    const [driverProfile, setDriverProfile] = useState(null);
    const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
    const [photoOptionsVisible, setPhotoOptionsVisible] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        type: 'info',
        buttons: []
    });

    // Custom Alert Helper Function
    const showAlert = (title, message, type = 'info', buttons = []) => {
        setAlertConfig({ title, message, type, buttons });
        setAlertVisible(true);
    };

    // Add error boundary for component
    useEffect(() => {
        // Component mounted successfully
    }, []);

    // Show error state if something went wrong
    if (hasError) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{t('profile.errorLoadingProfile')}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => setHasError(false)}
                    >
                        <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const {
        error: agencyError,
        isLoading: isLoadingAgency,
        execute: fetchAgencyDetails,
        retry: retryFetchAgency
    } = useApi(async () => {
        if (!user?.role === 'agency_employee' || !user?.agencyId || !user?.destinationCategoryId) {
            return null;
        }
        const [agencyRes, categoryRes] = await Promise.all([
            axios.get(`${process.env.EXPO_PUBLIC_API_URL}/auth/agencies/${user.agencyId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            }),
            axios.get(`${process.env.EXPO_PUBLIC_API_URL}/destinations/agency/${user.agencyId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            })
        ]);

        setAgencyName(agencyRes.data.name);
        const category = categoryRes.data.find(cat => cat._id === user.destinationCategoryId);
        if (category) {
            setDestinationCategory(`${category.from} to ${category.to}`);
        }
        return { agency: agencyRes.data, category };
    });

    // Fetch driver profile
    useEffect(() => {
        const fetchDriverProfile = async () => {
            try {
                if (!user?.token) {
                    return;
                }

                const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/driver-verification/profile`, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setDriverProfile(data);
                }
            } catch (error) {
                // Silently handle errors for driver profile fetch
            }
        };

        fetchDriverProfile();
    }, [user]);

    useEffect(() => {
        if (user?.role === 'agency_employee' && user.agencyId && user.destinationCategoryId) {
            fetchAgencyDetails();
        }
    }, [user]);

    // Handle photo upload
    const handlePhotoSelected = async (photo) => {
        if (!user?.token) {
            showAlert(t('common.error'), t('profile.mustBeLoggedIn'), 'error');
            return;
        }

        setIsUploadingPhoto(true);

        // Immediately show the local photo for better UX
        updateUser({ ...user, photoUrl: photo.uri });

        try {
            // Upload photo to Firebase Storage in background
            const photoURL = await uploadProfilePhoto(photo.uri, user.id);

            // Update with Firebase URL once upload is complete
            updateUser({ ...user, photoUrl: photoURL });

            // Try to update backend
            try {
                // Try the user update endpoint first
                const response = await axios.put(
                    `${process.env.EXPO_PUBLIC_API_URL}/auth/user`,
                    { photoUrl: photoURL },
                    {
                        headers: { Authorization: `Bearer ${user.token}` }
                    }
                );

                if (response.status === 200) {
                    showAlert(t('common.success'), t('profile.photoUpdatedSuccessfully'), 'success');
                } else {
                    throw new Error('Failed to update profile');
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    // Try alternative endpoint
                    try {
                        const response = await axios.put(
                            `${process.env.EXPO_PUBLIC_API_URL}/users/profile`,
                            { photoUrl: photoURL },
                            {
                                headers: { Authorization: `Bearer ${user.token}` }
                            }
                        );

                        if (response.status === 200) {
                            showAlert(t('common.success'), t('profile.photoUpdatedSuccessfully'), 'success');
                        } else {
                            throw new Error('Failed to update profile');
                        }
                    } catch (altError) {
                        // Backend update failed, but photo is uploaded and local state is updated
                        showAlert(
                            t('profile.photoUploaded'),
                            t('profile.photoUploadedButUpdateFailed'),
                            'warning'
                        );
                    }
                } else {
                    // Backend update failed, but photo is uploaded and local state is updated
                    showAlert(
                        t('profile.photoUploaded'),
                        t('profile.photoUploadedButUpdateFailed'),
                        'warning'
                    );
                }
            }
        } catch (error) {
            // If Firebase upload fails, revert to original state
            updateUser({ ...user, photoUrl: user.photoUrl });
            showAlert(t('common.error'), t('profile.failedToUploadPhoto'), 'error');
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    // Handle photo removal
    const handleRemovePhoto = async () => {
        showAlert(
            t('profile.removePhoto'),
            t('profile.areYouSureYouWantToRemoveYourProfilePhoto'),
            'warning',
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                    onPress: () => setAlertVisible(false)
                },
                {
                    text: t('profile.remove'),
                    style: 'destructive',
                    onPress: async () => {
                        setAlertVisible(false);
                        try {
                            // Delete from Firebase Storage if exists
                            if (user?.photoUrl) {
                                await deleteProfilePhoto(user.photoUrl);
                            }

                            // Update backend - try the correct endpoint first
                            try {
                                const response = await axios.put(
                                    `${process.env.EXPO_PUBLIC_API_URL}/auth/user`,
                                    { photoUrl: null },
                                    {
                                        headers: { Authorization: `Bearer ${user.token}` }
                                    }
                                );

                                if (response.status === 200) {
                                    // Update local user state
                                    updateUser({ ...user, photoUrl: null });
                                    showAlert(t('common.success'), t('profile.photoRemovedSuccessfully'), 'success');
                                } else {
                                    throw new Error('Failed to remove photo');
                                }
                            } catch (error) {
                                // Try alternative endpoint if first one fails
                                try {
                                    const response = await axios.put(
                                        `${process.env.EXPO_PUBLIC_API_URL}/users/profile`,
                                        { photoUrl: null },
                                        {
                                            headers: { Authorization: `Bearer ${user.token}` }
                                        }
                                    );

                                    if (response.status === 200) {
                                        // Update local user state
                                        updateUser({ ...user, photoUrl: null });
                                        showAlert(t('common.success'), t('profile.photoRemovedSuccessfully'), 'success');
                                    } else {
                                        throw new Error('Failed to remove photo');
                                    }
                                } catch (altError) {
                                    // If both endpoints fail, still update local state since Firebase deletion succeeded
                                    updateUser({ ...user, photoUrl: null });
                                    showAlert(
                                        t('profile.photoRemoved'),
                                        t('profile.photoRemovedLocallyButBackendUpdateFailed'),
                                        'info'
                                    );
                                }
                            }
                        } catch (error) {
                            showAlert(t('common.error'), t('profile.failedToRemovePhoto'), 'error');
                        }
                    }
                }
            ]
        );
    };

    const handleLogin = () => {
        router.push('/(auth)/login');
    };

    const handleLogout = () => {
        showAlert(
            t('profile.logout'),
            t('profile.areYouSureYouWantToLogout'),
            'warning',
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                    onPress: () => setAlertVisible(false)
                },
                {
                    text: t('profile.logout'),
                    style: 'destructive',
                    onPress: () => {
                        setAlertVisible(false);
                        logout();
                    }
                }
            ]
        );
    };

    const getInitials = () => {
        if (user?.name) {
            return user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        }
        return user?.email?.[0]?.toUpperCase() || '?';
    };

    useEffect(() => {
        if (agencyError) {
            showAlert(
                t('profile.errorLoadingProfileDetails'),
                agencyError.userMessage || t('profile.weEncounteredAnErrorWhileLoadingYourProfileDetails'),
                'error',
                [
                    {
                        text: t('common.cancel'),
                        style: 'cancel',
                        onPress: () => setAlertVisible(false)
                    },
                    {
                        text: t('common.retry'),
                        onPress: () => {
                            setAlertVisible(false);
                            retryFetchAgency();
                        }
                    }
                ]
            );
        }
    }, [agencyError]);



    if (!user) {
        return (
            <LinearGradient
                colors={['#0a2472', '#1E90FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.backgroundGradient}
            >
                <SafeAreaView style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <FontAwesome5 name="arrow-left" size={20} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t('profile.profile')}</Text>
                        <View style={styles.headerPlaceholder} />
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.loginCard}>
                            <FontAwesome5 name="user-circle" size={80} color="rgba(255, 255, 255, 0.8)" style={styles.loginIcon} />
                            <Text style={styles.loginTitle}>{t('profile.signInToWeShare')}</Text>
                            <Text style={styles.loginSubtitle}>
                                {t('profile.accessYourProfileManageYourRidesAndMore')}
                            </Text>
                            <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
                                <FontAwesome5 name="sign-in-alt" size={16} color="#fff" />
                                <Text style={styles.loginButtonText}>{t('profile.loginSignUp')}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#0a2472', '#1E90FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.backgroundGradient}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <FontAwesome5 name="arrow-left" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('profile.profile')}</Text>
                    <View style={styles.headerPlaceholder}>
                        <LanguageSwitcher style={styles.languageSwitcher} compact={true} />
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.profileCard}>
                        {/* Profile Header */}
                        <View style={styles.profileHeader}>
                            <TouchableOpacity
                                style={styles.avatarContainer}
                                onPress={() => setPhotoOptionsVisible(true)}
                                disabled={isUploadingPhoto}
                            >
                                {user?.photoUrl ? (
                                    <Image source={{ uri: user.photoUrl }} style={styles.avatarImage} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarText}>{getInitials()}</Text>
                                    </View>
                                )}

                                {/* Camera icon overlay */}
                                <View style={styles.cameraOverlay}>
                                    <FontAwesome5
                                        name="camera"
                                        size={16}
                                        color="#fff"
                                    />
                                </View>

                                {/* Upload indicator */}
                                {isUploadingPhoto && (
                                    <View style={styles.uploadOverlay}>
                                        <FontAwesome5
                                            name="spinner"
                                            size={20}
                                            color="#fff"
                                        />
                                    </View>
                                )}
                            </TouchableOpacity>



                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user.name}</Text>
                                <Text style={styles.userEmail}> {user.contact_number}</Text>
                                <View style={styles.roleContainer}>
                                    <FontAwesome5
                                        name={user.role === 'agency_employee' ? 'building' : 'user'}
                                        size={12}
                                        color="#0a2472"
                                    />
                                    <Text style={styles.roleText}>
                                        {user.role === 'user' ? t('profile.normalUser') : t('profile.agencyEmployee')}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Agency Information */}
                        {user.role === 'agency_employee' && (
                            <View style={styles.agencySection}>
                                <View style={styles.sectionDivider} />
                                <Text style={styles.sectionTitle}>{t('profile.agencyInformation')}</Text>

                                <View style={styles.infoRow}>
                                    <FontAwesome5 name="building" size={16} color="#0a2472" />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>{t('profile.agency')}</Text>
                                        <Text style={styles.infoValue}>
                                            {isLoadingAgency ? t('profile.loading') : agencyName || t('profile.notSet')}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.infoRow}>
                                    <FontAwesome5 name="route" size={16} color="#0a2472" />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>{t('profile.destinationRoute')}</Text>
                                        <View style={styles.destinationContainer}>
                                            <Text style={styles.infoValue}>
                                                {isLoadingAgency ? t('profile.loading') : destinationCategory?.split(' to ')[0] || t('profile.notSet')}
                                            </Text>
                                            <FontAwesome5 name="arrow-right" size={12} color="#666" style={styles.arrowIcon} />
                                            <Text style={styles.infoValue}>
                                                {isLoadingAgency ? t('profile.loading') : destinationCategory?.split(' to ')[1] || t('profile.notSet')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Driver Verification Status */}
                        <View style={styles.verificationSection}>
                            <View style={styles.sectionDivider} />
                            <Text style={styles.sectionTitle}>{t('profile.driverVerification')}</Text>

                            {driverProfile?.verifiedDriver ? (
                                <View style={styles.verificationCard}>
                                    <View style={styles.verificationHeader}>
                                        <FontAwesome5 name="check-circle" size={20} color="#4CAF50" />
                                        <Text style={styles.verificationStatus}>{t('profile.verifiedDriver')}</Text>
                                    </View>
                                    <View style={styles.verificationInfo}>
                                        <Text style={styles.verificationText}>
                                            {t('profile.youAreVerifiedAsADriverAndCanPostPrivateRides')}
                                        </Text>
                                        <Text style={styles.verificationDetails}>
                                            {t('profile.licensePlate')}: {driverProfile.driverProfile.vehicleLicensePlate}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.verificationButton}
                                        onPress={() => router.push('/(auth)/driver-verification')}
                                    >
                                        <FontAwesome5 name="edit" size={16} color="#fff" />
                                        <Text style={styles.verificationButtonText}>{t('profile.editDriverProfile')}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.verificationCard}>
                                    <View style={styles.verificationHeader}>
                                        <FontAwesome5 name="clock" size={20} color="#FF9800" />
                                        <Text style={styles.verificationStatus}>{t('profile.notVerified')}</Text>
                                    </View>
                                    <View style={styles.verificationInfo}>
                                        <Text style={styles.verificationText}>
                                            {t('profile.completeDriverVerificationToStartPostingPrivateRidesAndEarnMoney')}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.verificationButton}
                                        onPress={() => router.push('/(auth)/driver-verification')}
                                    >
                                        <FontAwesome5 name="user-check" size={16} color="#fff" />
                                        <Text style={styles.verificationButtonText}>{t('profile.completeVerification')}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Menu Options */}
                        <View style={styles.menuSection}>
                            <View style={styles.sectionDivider} />
                            <Text style={styles.sectionTitle}>{t('profile.account')}</Text>

                            <TouchableOpacity style={styles.menuItem}
                                onPress={() => router.push('/(auth)/driver-verification')}
                            >

                                <FontAwesome5 name="car" size={18} color="#0a2472" />
                                <Text style={styles.menuItemText}>{t('profile.driverVerification')}</Text>
                                <FontAwesome5 name="chevron-right" size={16} color="#666" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem}>
                                <FontAwesome5 name="bell" size={18} color="#0a2472" />
                                <Text style={styles.menuItemText}>{t('profile.notifications')}</Text>
                                <FontAwesome5 name="chevron-right" size={16} color="#666" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem}>
                                <FontAwesome5 name="cog" size={18} color="#0a2472" />
                                <Text style={styles.menuItemText}>{t('profile.settings')}</Text>
                                <FontAwesome5 name="chevron-right" size={16} color="#666" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => router.push('/(profile)/help-support')}
                            >
                                <FontAwesome5 name="question-circle" size={18} color="#0a2472" />
                                <Text style={styles.menuItemText}>{t('profile.helpSupport')}</Text>
                                <FontAwesome5 name="chevron-right" size={16} color="#666" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => router.push('/(rides)/booked')}
                            >
                                <FontAwesome5 name="history" size={18} color="#0a2472" />
                                <Text style={styles.menuItemText}>{t('profile.rideHistory')}</Text>
                                <FontAwesome5 name="chevron-right" size={16} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Logout Button */}
                        <View style={styles.logoutSection}>
                            <View style={styles.sectionDivider} />
                            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                                <FontAwesome5 name="sign-out-alt" size={18} color="#fff" />
                                <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
            <PhotoPicker
                visible={photoPickerVisible}
                onClose={() => setPhotoPickerVisible(false)}
                onPhotoSelected={handlePhotoSelected}
            />

            {/* Photo Options Modal */}
            <Modal
                visible={photoOptionsVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setPhotoOptionsVisible(false)}
            >
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('profile.profilePhoto')}</Text>
                            <TouchableOpacity onPress={() => setPhotoOptionsVisible(false)} style={styles.closeButton}>
                                <FontAwesome5 name="times" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalOptions}>
                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={() => {
                                    setPhotoOptionsVisible(false);
                                    setPhotoPickerVisible(true);
                                }}
                            >
                                <View style={styles.modalOptionIcon}>
                                    <FontAwesome5 name="images" size={24} color="#667eea" />
                                </View>
                                <Text style={styles.modalOptionText}>{t('profile.changePhoto')}</Text>
                            </TouchableOpacity>

                            {user?.photoUrl && (
                                <TouchableOpacity
                                    style={[styles.modalOption, styles.removeOption]}
                                    onPress={() => {
                                        setPhotoOptionsVisible(false);
                                        handleRemovePhoto();
                                    }}
                                >
                                    <View style={[styles.modalOptionIcon, styles.removeIcon]}>
                                        <FontAwesome5 name="trash" size={24} color="#dc3545" />
                                    </View>
                                    <Text style={[styles.modalOptionText, styles.removeText]}>{t('profile.removePhoto')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={() => setPhotoOptionsVisible(false)}
                        >
                            <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                buttons={alertConfig.buttons}
                onDismiss={() => setAlertVisible(false)}
            />
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
    scrollContent: {
        padding: 16,
    },
    // Login Card Styles
    loginCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        marginTop: 40,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    loginIcon: {
        marginBottom: 24,
    },
    loginTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    loginSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 22,
    },
    loginButton: {
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0a2472',
    },
    // Profile Card Styles
    profileCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        position: 'relative', // Needed for overlay positioning
        marginRight: 16,
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#0a2472',
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#0a2472',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#1E90FF',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoActions: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
        flexDirection: 'row',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    photoActionButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0a2472',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f4ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0a2472',
        marginLeft: 4,
    },
    // Agency Section
    agencySection: {
        marginBottom: 20,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0a2472',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    infoContent: {
        flex: 1,
        marginLeft: 12,
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    destinationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    arrowIcon: {
        marginHorizontal: 8,
    },
    // Menu Section
    menuSection: {
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        marginLeft: 12,
    },
    // Logout Section
    logoutSection: {
        marginTop: 20,
    },
    logoutButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    // Verification Section
    verificationSection: {
        marginBottom: 20,
    },
    verificationCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    verificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    verificationStatus: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    verificationInfo: {
        marginBottom: 16,
    },
    verificationText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    verificationDetails: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    verificationButton: {
        backgroundColor: '#0a2472',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    verificationButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    // Error Styles
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#0a2472',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    // Overlay Styles
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
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
    },
    modalOptions: {
        gap: 15,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    modalOptionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    modalOptionText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    removeOption: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
    },
    removeIcon: {
        backgroundColor: '#fee2e2',
    },
    removeText: {
        color: '#dc2626',
    },
    modalCancelButton: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#dc3545',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#c82333',
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
});
