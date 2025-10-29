import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Edit,
  Mail,
  Phone,
  Shield,
  LogOut,
  Bell,
  Settings,
  Camera,
  Check,
  X,
  Calendar,
  MapPin,
  MessageCircle,
  CreditCard,
  Star,
} from 'lucide-react-native';
import { apiService } from '../services/api';
import { launchImageLibrary, launchCamera, ImagePickerResponse, CameraOptions, ImageLibraryOptions } from 'react-native-image-picker';

interface ProfileScreenProps {
  userData: any;
  onLogout: () => void;
  onNavigate?: (screen: string) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userData,
  onLogout,
  onNavigate,
}) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Profile data
  const [fullName, setFullName] = useState(userData?.user?.fullName || '');
  const [phone, setPhone] = useState(userData?.user?.phone || '');
  const [email, setEmail] = useState(userData?.user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(userData?.user?.avatarUrl || null);
  
  // Customer profile data
  const [customer, setCustomer] = useState<any>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: true,
    push: true,
  });

  useEffect(() => {
    if (userData) {
      setFullName(userData.user?.fullName || '');
      setPhone(userData.user?.phone || '');
      setEmail(userData.user?.email || '');
      setAvatarUrl(userData.user?.avatarUrl || null);
      
      if (userData.customer) {
        setCustomer(userData.customer);
        setNotificationSettings(
          userData.customer.notificationSettings || {
            email: true,
            sms: true,
            push: true,
          }
        );
      }
    }
  }, [userData]);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.updateProfile({
        fullName,
        phone,
      });

      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setEditing(false);
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFullName(userData?.user?.fullName || '');
    setPhone(userData?.user?.phone || '');
    setEditing(false);
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => {
            try {
              const options: CameraOptions = {
                mediaType: 'photo',
                quality: 0.8,
                includeBase64: false,
              };
              
              launchCamera(options, (response: ImagePickerResponse) => {
                if (response.didCancel) {
                  return;
                } else if (response.errorMessage) {
                  Alert.alert('Error', response.errorMessage);
                } else if (response.assets && response.assets[0] && response.assets[0].uri) {
                  uploadImage(response.assets[0].uri);
                }
              });
            } catch (error: any) {
              console.error('Camera error:', error);
              Alert.alert('Error', 'Failed to open camera. Please make sure the app has camera permissions.');
            }
          },
        },
        {
          text: 'Photo Library',
          onPress: () => {
            const options: ImageLibraryOptions = {
              mediaType: 'photo',
              quality: 0.8,
              includeBase64: false,
            };
            
            launchImageLibrary(options, (response: ImagePickerResponse) => {
              if (response.didCancel) {
                return;
              } else if (response.errorMessage) {
                Alert.alert('Error', response.errorMessage);
              } else if (response.assets && response.assets[0] && response.assets[0].uri) {
                uploadImage(response.assets[0].uri);
              }
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setUploadingImage(true);
      
      // Create FormData
      const formData = new FormData();
      formData.append('picture', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      // Upload image
      const response = await apiService.uploadProfilePicture(formData);
      
      if (response.success && response.data?.url) {
        setAvatarUrl(response.data.url);
        Alert.alert('Success', 'Profile picture updated successfully');
      } else {
        Alert.alert('Error', 'Failed to upload profile picture');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleNotificationToggle = async (type: 'email' | 'sms' | 'push') => {
    try {
      const newSettings = {
        ...notificationSettings,
        [type]: !notificationSettings[type],
      };
      
      setNotificationSettings(newSettings);
      
      const response = await apiService.updateNotificationSettings(newSettings);
      
      if (!response.success) {
        // Revert on error
        setNotificationSettings(notificationSettings);
        Alert.alert('Error', 'Failed to update notification settings');
      }
    } catch (error: any) {
      console.error('Update notification settings error:', error);
      setNotificationSettings(notificationSettings);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh logic here - you can add API call to refresh user data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const AccountMenuItem = ({ 
    icon: Icon, 
    label, 
    value, 
    onPress, 
    showArrow = false,
    color = '#ec4899'
  }: any) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuLabel}>{label}</Text>
        {value && <Text style={styles.menuValue}>{value}</Text>}
      </View>
      {showArrow && <Text style={styles.arrow}>›</Text>}
    </TouchableOpacity>
  );

  const NotificationToggle = ({ label, enabled, onToggle }: any) => (
    <View style={styles.notificationRow}>
      <Text style={styles.notificationLabel}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.toggle,
          enabled && styles.toggleActive,
        ]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={[
          styles.toggleThumb,
          enabled && styles.toggleThumbActive,
        ]} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ec4899"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          {editing ? (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.iconButton, styles.saveButton]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Check size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setEditing(true)}
            >
              <Edit size={20} color="#0f172a" />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleImagePicker}
            disabled={uploadingImage || !editing}
          >
            {uploadingImage ? (
              <View style={styles.avatarUploading}>
                <ActivityIndicator size="large" color="#ec4899" />
              </View>
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={48} color="#ec4899" />
              </View>
            )}
            {editing && (
              <View style={styles.avatarEditBadge}>
                <Camera size={16} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userEmail}>{email}</Text>

          <View style={styles.statusBadge}>
            <Shield size={14} color="#10b981" />
            <Text style={styles.statusText}>Verified Account</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#94a3b8"
              />
            ) : (
              <View style={styles.inputDisplay}>
                <User size={18} color="#64748b" />
                <Text style={styles.inputDisplayText}>{fullName}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputDisplay}>
              <Mail size={18} color="#64748b" />
              <Text style={styles.inputDisplayText}>{email}</Text>
            </View>
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />
            ) : (
              <View style={styles.inputDisplay}>
                <Phone size={18} color="#64748b" />
                <Text style={styles.inputDisplayText}>{phone || 'Not provided'}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <AccountMenuItem
            icon={Calendar}
            label="My Bookings"
            onPress={() => onNavigate?.('Bookings')}
            showArrow
            color="#2563EB"
          />
          
          <AccountMenuItem
            icon={MessageCircle}
            label="Messages"
            value="3 unread"
            onPress={() => onNavigate?.('Messages')}
            showArrow
            color="#ec4899"
          />
          
          <AccountMenuItem
            icon={Bell}
            label="Notifications"
            onPress={() => onNavigate?.('Notifications')}
            showArrow
            color="#f59e0b"
          />
          
          <AccountMenuItem
            icon={Settings}
            label="Settings"
            onPress={() => onNavigate?.('Settings')}
            showArrow
            color="#64748b"
          />
        </View>

        {/* Notification Settings */}
        {customer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Preferences</Text>
            
            <View style={styles.notificationContainer}>
              <NotificationToggle
                label="Email Notifications"
                enabled={notificationSettings.email}
                onToggle={() => handleNotificationToggle('email')}
              />
              
              <NotificationToggle
                label="SMS Notifications"
                enabled={notificationSettings.sms}
                onToggle={() => handleNotificationToggle('sms')}
              />
              
              <NotificationToggle
                label="Push Notifications"
                enabled={notificationSettings.push}
                onToggle={() => handleNotificationToggle('push')}
              />
            </View>
      </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#ec4899',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ec4899',
  },
  avatarUploading: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ec4899',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0f172a',
  },
  inputDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  inputDisplayText: {
    fontSize: 15,
    color: '#0f172a',
  },
  helperText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
  },
  menuValue: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: '#94a3b8',
  },
  notificationContainer: {
    gap: 12,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  notificationLabel: {
    fontSize: 15,
    color: '#0f172a',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#ec4899',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    transform: [{ translateX: 0 }],
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});

export default ProfileScreen;
