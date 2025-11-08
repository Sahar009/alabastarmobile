import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Lock,
  Trash2,
  HelpCircle,
  Info,
  Eye,
  EyeOff,
  X,
} from 'lucide-react-native';
import { apiService } from '../services/api';

interface SettingsScreenProps {
  userData: any;
  onBack: () => void;
  onNavigate?: (screen: string) => void;
  onLogout?: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  userData,
  onBack,
  onNavigate,
  onLogout,
}) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.changePassword(currentPassword, newPassword);

      if (response.success) {
        Alert.alert('Success', 'Password changed successfully', [
          {
            text: 'OK',
            onPress: () => {
              setShowPasswordModal(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Show confirmation alert
            Alert.alert(
              'Final Confirmation',
              'This is your last chance to cancel. Your account and all associated data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete My Account',
                  style: 'destructive',
                  onPress: deleteAccount,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const deleteAccount = async () => {
    try {
      setDeletingAccount(true);
      const response = await apiService.deleteAccount();

      if (response.success) {
        Alert.alert(
          'Account Deleted',
          'Your account has been successfully deleted. You will be logged out.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Logout user after account deletion
                if (onLogout) {
                  onLogout();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to delete account');
        setDeletingAccount(false);
      }
    } catch (error: any) {
      console.error('Delete account error:', error);
      Alert.alert('Error', error.message || 'Failed to delete account');
      setDeletingAccount(false);
    }
  };

  const SettingItem = ({
    icon: Icon,
    label,
    value,
    onPress,
    color = '#ec4899',
    showArrow = false,
  }: any) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {showArrow && <Text style={styles.arrow}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <SettingItem
            icon={Lock}
            label="Change Password"
            showArrow
            onPress={() => setShowPasswordModal(true)}
            color="#64748b"
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <SettingItem
            icon={HelpCircle}
            label="Help & Support"
            showArrow
            onPress={() => {
              onNavigate?.('HelpSupport');
            }}
            color="#10b981"
          />
          
          <SettingItem
            icon={Info}
            label="About"
            value="Version 1.0.0"
            showArrow
            onPress={() => {
              onNavigate?.('About');
            }}
            color="#64748b"
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
            disabled={deletingAccount}
          >
            {deletingAccount ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Trash2 size={20} color="#ef4444" />
            )}
            <Text style={styles.dangerButtonText}>
              {deletingAccount ? 'Deleting Account...' : 'Delete Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Current Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter current password"
                    placeholderTextColor="#94a3b8"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={styles.eyeIcon}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={20} color="#94a3b8" />
                    ) : (
                      <Eye size={20} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter new password"
                    placeholderTextColor="#94a3b8"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeIcon}
                  >
                    {showNewPassword ? (
                      <EyeOff size={20} color="#94a3b8" />
                    ) : (
                      <Eye size={20} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.helperText}>
                  Password must be at least 6 characters
                </Text>
              </View>

              {/* Confirm New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm new password"
                    placeholderTextColor="#94a3b8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#94a3b8" />
                    ) : (
                      <Eye size={20} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  settingItem: {
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
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
  },
  settingValue: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: '#94a3b8',
    marginLeft: 8,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxHeight: 400,
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
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  eyeIcon: {
    padding: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    backgroundColor: '#ec4899',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default SettingsScreen;

