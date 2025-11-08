import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronRight,
  CreditCard,
  Shield,
} from 'lucide-react-native';
import { apiService } from '../services/api';

interface ProviderSettingsScreenProps {
  userData: any;
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
}

interface NotificationPreferencesState {
  email: boolean;
  sms: boolean;
  push: boolean;
}

interface PrivacyPreferencesState {
  showProfile: boolean;
  showContactInfo: boolean;
  showPortfolio: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferencesState = {
  email: true,
  sms: false,
  push: true,
};

const DEFAULT_PRIVACY_PREFS: PrivacyPreferencesState = {
  showProfile: true,
  showContactInfo: true,
  showPortfolio: true,
};

const ProviderSettingsScreen: React.FC<ProviderSettingsScreenProps> = ({ onBack, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferencesState>(
    DEFAULT_NOTIFICATION_PREFS,
  );
  const [privacyPreferences, setPrivacyPreferences] = useState<PrivacyPreferencesState>(DEFAULT_PRIVACY_PREFS);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const settingsResponse = await apiService.getProviderSettings();

      if (settingsResponse.success) {
        const data = settingsResponse.data || {};

        if (data.notifications) {
          setNotificationPreferences({
            email: Boolean(data.notifications.email ?? DEFAULT_NOTIFICATION_PREFS.email),
            sms: Boolean(data.notifications.sms ?? DEFAULT_NOTIFICATION_PREFS.sms),
            push: Boolean(data.notifications.push ?? DEFAULT_NOTIFICATION_PREFS.push),
          });
        } else {
          setNotificationPreferences(DEFAULT_NOTIFICATION_PREFS);
        }

        if (data.privacy) {
          setPrivacyPreferences({
            showProfile: Boolean(data.privacy.showProfile ?? DEFAULT_PRIVACY_PREFS.showProfile),
            showContactInfo: Boolean(data.privacy.showContactInfo ?? DEFAULT_PRIVACY_PREFS.showContactInfo),
            showPortfolio: Boolean(data.privacy.showPortfolio ?? DEFAULT_PRIVACY_PREFS.showPortfolio),
          });
        } else {
          setPrivacyPreferences(DEFAULT_PRIVACY_PREFS);
        }
      } else {
        Alert.alert('Provider Settings', settingsResponse.message || 'Unable to load provider settings.');
      }
    } catch (error: any) {
      console.error('Provider settings load error:', error);
      Alert.alert('Error', error?.message || 'Unable to load provider settings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);


  const toggleNotificationPreference = async (key: keyof NotificationPreferencesState) => {
    const previous = notificationPreferences;
    const updated = { ...notificationPreferences, [key]: !notificationPreferences[key] };
    setNotificationPreferences(updated);

    try {
      const response = await apiService.updateProviderNotificationSettings(updated);
      if (!response.success) {
        throw new Error(response.message || 'Unable to update notifications');
      }
    } catch (error: any) {
      console.error('Notification preference update error:', error);
      setNotificationPreferences(previous);
      Alert.alert('Update Failed', error?.message || 'Unable to update notification preferences.');
    }
  };

  const togglePrivacyPreference = async (key: keyof PrivacyPreferencesState) => {
    const previous = privacyPreferences;
    const updated = { ...privacyPreferences, [key]: !privacyPreferences[key] };
    setPrivacyPreferences(updated);

    try {
      const response = await apiService.updateProviderPrivacySettings(updated);
      if (!response.success) {
        throw new Error(response.message || 'Unable to update privacy settings');
      }
    } catch (error: any) {
      console.error('Privacy preference update error:', error);
      setPrivacyPreferences(previous);
      Alert.alert('Update Failed', error?.message || 'Unable to update privacy settings.');
    }
  };

  const handleManageSubscription = () => {
    onNavigate?.('provider-subscription');
  };

  const handleSupport = async () => {
    const supportEmail = 'mailto:support@alabastar.com?subject=Provider%20Support%20Request';
    try {
      const supported = await Linking.canOpenURL(supportEmail);
      if (supported) {
        await Linking.openURL(supportEmail);
      } else {
        throw new Error('Cannot open mail client.');
      }
    } catch (error: any) {
      console.error('Support link error:', error);
      Alert.alert('Support', 'Contact support@alabastar.com if you need help with billing or subscriptions.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSettings();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={onBack}
          disabled={!onBack}
          style={[styles.headerButton, !onBack && styles.headerButtonDisabled]}
          activeOpacity={onBack ? 0.7 : 1}
        >
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Provider Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          <Text style={styles.sectionSubtitle}>Choose how you stay informed about bookings and messages</Text>

          <View style={styles.toggleRowSimple}>
            <Text style={styles.toggleLabel}>Email alerts</Text>
            <Switch
              value={notificationPreferences.email}
              onValueChange={() => toggleNotificationPreference('email')}
              trackColor={{ false: '#cbd5f5', true: '#ec4899' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.toggleRowSimple}>
            <Text style={styles.toggleLabel}>SMS notifications</Text>
            <Switch
              value={notificationPreferences.sms}
              onValueChange={() => toggleNotificationPreference('sms')}
              trackColor={{ false: '#cbd5f5', true: '#ec4899' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.toggleRowSimple}>
            <Text style={styles.toggleLabel}>Push notifications</Text>
            <Switch
              value={notificationPreferences.push}
              onValueChange={() => toggleNotificationPreference('push')}
              trackColor={{ false: '#cbd5f5', true: '#ec4899' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Privacy Controls</Text>
          <Text style={styles.sectionSubtitle}>Control how your profile information is displayed</Text>

          <View style={styles.toggleRowSimple}>
            <Text style={styles.toggleLabel}>Show profile publicly</Text>
            <Switch
              value={privacyPreferences.showProfile}
              onValueChange={() => togglePrivacyPreference('showProfile')}
              trackColor={{ false: '#cbd5f5', true: '#ec4899' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.toggleRowSimple}>
            <Text style={styles.toggleLabel}>Display contact info</Text>
            <Switch
              value={privacyPreferences.showContactInfo}
              onValueChange={() => togglePrivacyPreference('showContactInfo')}
              trackColor={{ false: '#cbd5f5', true: '#ec4899' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.toggleRowSimple}>
            <Text style={styles.toggleLabel}>Show portfolio images</Text>
            <Switch
              value={privacyPreferences.showPortfolio}
              onValueChange={() => togglePrivacyPreference('showPortfolio')}
              trackColor={{ false: '#cbd5f5', true: '#ec4899' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <Text style={styles.sectionSubtitle}>Manage your subscription plan and billing</Text>

          <TouchableOpacity style={styles.subscriptionAction} onPress={handleManageSubscription}>
            <CreditCard size={18} color="#ec4899" />
            <View style={styles.subscriptionActionText}>
              <Text style={styles.subscriptionActionTitle}>Manage subscription</Text>
              <Text style={styles.subscriptionActionSubtitle}>View plans, billing cycle, and subscription details</Text>
            </View>
            <ChevronRight size={18} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.subscriptionAction} onPress={handleSupport}>
            <Shield size={18} color="#0f172a" />
            <View style={styles.subscriptionActionText}>
              <Text style={styles.subscriptionActionTitle}>Billing support</Text>
              <Text style={styles.subscriptionActionSubtitle}>Reach the Alabastar team if you need help with payments</Text>
            </View>
            <ChevronRight size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ec4899" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonDisabled: {
    opacity: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  toggleRowSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleTextGroup: {
    flex: 1,
    gap: 4,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  toggleHint: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  subscriptionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  subscriptionActionText: {
    flex: 1,
  },
  subscriptionActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  subscriptionActionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  bottomSpacer: {
    height: 60,
  },
});

export default ProviderSettingsScreen;
