import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  Gift,
  Share2,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react-native';
import { apiService } from '../services/api';

interface ProviderReferralScreenProps {
  userData: any;
  onBack?: () => void;
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  totalCommissions: number;
  pendingCommissions: number;
}

interface ReferralHistoryItem {
  id: string;
  referredUserId?: string;
  referredUserName?: string;
  referredUserEmail?: string;
  status: 'pending' | 'completed' | 'cancelled';
  commissionAmount?: number;
  commissionStatus?: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  completedAt?: string;
}

const ProviderReferralScreen: React.FC<ProviderReferralScreenProps> = ({ userData, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [referralCode, setReferralCode] = useState<string>('');
  const [providerId, setProviderId] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
  });
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);

  const formatCurrency = useCallback((amount?: number, currency = 'NGN') => {
    if (!amount || Number.isNaN(amount)) {
      return currency === 'NGN' ? '₦0' : `${currency} 0`;
    }
    try {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount.toFixed(0)}`;
    }
  }, []);

  const formatDate = useCallback((value?: string | null) => {
    if (!value) return '—';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return '—';
      }
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return '—';
    }
  }, []);

  const fetchReferralData = useCallback(async () => {
    try {
      setLoading(true);
      const profileResponse = await apiService.getProviderProfile().catch(() => ({ success: false, data: null }));
      
      let currentProviderId: string | null = null;
      if (profileResponse?.success && profileResponse.data) {
        currentProviderId = profileResponse.data.id || null;
      }

      const [statsResponse, historyResponse] = await Promise.all([
        apiService.getReferralStats(currentProviderId || undefined).catch(() => ({ success: false, data: null })),
        apiService.getReferralHistory().catch(() => ({ success: false, data: [] })),
      ]);

      if (profileResponse?.success && profileResponse.data) {
        const profile = profileResponse.data;
        if (profile.id) {
          setProviderId(profile.id);
        }
        if (profile.referralCode) {
          setReferralCode(profile.referralCode);
        } else {
          setReferralCode('');
        }
      } else {
        setReferralCode('');
      }

      if (statsResponse?.success && statsResponse.data) {
        const statsData = statsResponse.data;
        setStats({
          totalReferrals: statsData.stats?.totalReferrals || statsData.totalReferrals || 0,
          completedReferrals: statsData.stats?.completedReferrals || statsData.completedReferrals || 0,
          totalCommissions: Number.parseFloat(statsData.stats?.totalCommissions || statsData.totalCommissions || '0') || 0,
          pendingCommissions: Number.parseFloat(statsData.stats?.pendingCommissions || statsData.pendingCommissions || '0') || 0,
        });
      } else {
        setStats({
          totalReferrals: 0,
          completedReferrals: 0,
          totalCommissions: 0,
          pendingCommissions: 0,
        });
      }

      if (historyResponse?.success && Array.isArray(historyResponse.data)) {
        const mappedHistory = historyResponse.data.map((item: any) => ({
          id: item.id || item.referralId,
          referredUserId: item.referredUserId || item.userId,
          referredUserName: item.referredUser?.fullName || item.referredUserName || 'Unknown User',
          referredUserEmail: item.referredUser?.email || item.referredUserEmail,
          status: (item.status || 'pending').toLowerCase(),
          commissionAmount: Number.parseFloat(item.commissionAmount || item.commission || '0') || 0,
          commissionStatus: (item.commissionStatus || 'pending').toLowerCase(),
          createdAt: item.createdAt || item.referredAt,
          completedAt: item.completedAt || item.subscribedAt,
        })) as ReferralHistoryItem[];
        setHistory(mappedHistory);
      } else {
        setHistory([]);
      }
    } catch (error: any) {
      console.error('Referral data fetch error:', error);
      Alert.alert('Referrals', error?.message || 'Unable to load referral data right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const handleGenerateCode = async () => {
    if (!providerId) {
      Alert.alert('Provider Profile', 'Please complete your provider profile first.');
      return;
    }
    try {
      setGenerating(true);
      const response = await apiService.generateReferralCode(providerId);
      if (response.success && response.data) {
        setReferralCode(response.data.referralCode || response.data.code);
        Alert.alert('Success', 'Your referral code has been generated!');
        fetchReferralData();
      } else {
        Alert.alert('Generate Failed', response.message || 'Unable to generate referral code.');
      }
    } catch (error: any) {
      console.error('Generate referral code error:', error);
      Alert.alert('Error', error?.message || 'Unable to generate referral code right now.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!referralCode) {
      Alert.alert('No Code', 'Please generate a referral code first.');
      return;
    }
    try {
      Clipboard.setString(referralCode);
      Alert.alert('Copied!', 'Referral code copied to clipboard.');
    } catch (error) {
      Alert.alert('Copy Failed', 'Unable to copy referral code.');
    }
  };

  const handleShareCode = async () => {
    if (!referralCode) {
      Alert.alert('No Code', 'Please generate a referral code first.');
      return;
    }

    const shareText = `Join me on Alabastar! Use my referral code: ${referralCode} to get started as a service provider and earn great opportunities.`;
    const shareUrl = `https://alabastar.com/signup?ref=${referralCode}`;

    try {
      const result = await Share.share({
        message: `${shareText}\n\n${shareUrl}`,
        title: 'Join Alabastar with my referral code',
      });
      if (result.action === Share.sharedAction) {
        console.log('Referral code shared successfully');
      }
    } catch (error: any) {
      Alert.alert('Share Failed', error?.message || 'Unable to share referral code.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReferralData();
  };

  const renderHistoryItem = (item: ReferralHistoryItem) => {
    const statusColor =
      item.status === 'completed' ? '#22c55e' : item.status === 'cancelled' ? '#ef4444' : '#f59e0b';

    return (
      <View key={item.id} style={styles.historyItem}>
        <View style={styles.historyIcon}>
          <Users size={18} color="#ec4899" />
        </View>
        <View style={styles.historyContent}>
          <Text style={styles.historyName}>{item.referredUserName || 'Unknown User'}</Text>
          <Text style={styles.historyEmail}>{item.referredUserEmail || '—'}</Text>
          <Text style={styles.historyMeta}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.historyAmount}>
          <Text style={[styles.historyStatus, { color: statusColor }]}>
            {item.status.toUpperCase()}
          </Text>
          {item.commissionAmount ? (
            <Text style={styles.historyCommission}>
              {formatCurrency(item.commissionAmount)} commission
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={onBack}
          disabled={!onBack}
          activeOpacity={onBack ? 0.7 : 1}
          style={[styles.headerButton, !onBack && styles.headerButtonDisabled]}
        >
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referrals</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Your Referral Code</Text>
              <Text style={styles.sectionSubtitle}>Share your code and earn 10% commission on referrals</Text>
            </View>
          </View>

          {referralCode ? (
            <View style={styles.codeCard}>
              <View style={styles.codeDisplay}>
                <Text style={styles.codeText}>{referralCode}</Text>
              </View>
              <View style={styles.codeActions}>
                <TouchableOpacity style={styles.codeButton} onPress={handleCopyCode}>
                  <Copy size={16} color="#ffffff" />
                  <Text style={styles.codeButtonText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.codeButton, styles.codeButtonSecondary]} onPress={handleShareCode}>
                  <Share2 size={16} color="#ec4899" />
                  <Text style={[styles.codeButtonText, styles.codeButtonTextSecondary]}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCodeCard}>
              <Gift size={40} color="#cbd5f5" />
              <Text style={styles.emptyCodeTitle}>No referral code yet</Text>
              <Text style={styles.emptyCodeSubtitle}>Generate your unique referral code to start earning commissions</Text>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerateCode}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Gift size={18} color="#ffffff" />
                    <Text style={styles.generateButtonText}>Generate Code</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Users size={20} color="#ec4899" />
            </View>
            <Text style={styles.statValue}>{stats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
              <CheckCircle size={20} color="#22c55e" />
            </View>
            <Text style={styles.statValue}>{stats.completedReferrals}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <TrendingUp size={20} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>{formatCurrency(stats.totalCommissions)}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#e0f2fe' }]}>
              <Wallet size={20} color="#0ea5e9" />
            </View>
            <Text style={styles.statValue}>{formatCurrency(stats.pendingCommissions)}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Referral History</Text>
              <Text style={styles.sectionSubtitle}>Track your referrals and commissions</Text>
            </View>
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Users size={42} color="#cbd5f5" />
              <Text style={styles.emptyHistoryTitle}>No referrals yet</Text>
              <Text style={styles.emptyHistorySubtitle}>
                Share your referral code to start earning commissions when others join and subscribe.
              </Text>
            </View>
          ) : (
            history.map(renderHistoryItem)
          )}
        </View>

        <View style={styles.infoCard}>
          <Gift size={24} color="#ec4899" />
          <Text style={styles.infoTitle}>How Referrals Work</Text>
          <Text style={styles.infoText}>
            Share your referral code with other service providers. When they register and complete their first subscription, you earn 10% commission on their subscription fee.
          </Text>
          <Text style={styles.infoText}>
            Commissions are paid when referrals complete their first subscription payment.
          </Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {loading && !refreshing ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ec4899" />
        </View>
      ) : null}
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
  codeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  codeDisplay: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ec4899',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ec4899',
    letterSpacing: 4,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  codeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ec4899',
    paddingVertical: 14,
    borderRadius: 14,
  },
  codeButtonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#ec4899',
  },
  codeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  codeButtonTextSecondary: {
    color: '#ec4899',
  },
  emptyCodeCard: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  emptyCodeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  emptyCodeSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ec4899',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 8,
  },
  generateButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyContent: {
    flex: 1,
  },
  historyName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  historyEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  historyMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  historyAmount: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyStatus: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  historyCommission: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyHistoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  emptyHistorySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fed7aa',
    gap: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
});

export default ProviderReferralScreen;

