import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Info,
  RefreshCcw,
  ShieldCheck,
  Wallet,
} from 'lucide-react-native';
import { apiService } from '../services/api';

interface ProviderSubscriptionScreenProps {
  userData: any;
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  description?: string;
  features?: string[];
  highlight?: boolean;
  currency?: string;
  metadata?: Record<string, any> | null;
}

interface ProviderSubscription {
  id: string;
  planId: string;
  planName: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  nextBillingDate?: string | null;
  autoRenew?: boolean;
  amount?: number;
  currency?: string;
  featureLimits?: Record<string, any> | null;
}

interface PaymentHistoryItem {
  id: string;
  amount: number;
  currency?: string;
  status: 'success' | 'pending' | 'failed';
  date: string;
  planName: string;
  transactionId?: string;
}

const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    interval: 'monthly',
    description: 'Get listed and receive basic enquiries',
    features: [
      'Appear in local searches',
      'Basic profile & portfolio',
      'Manual booking management',
    ],
    highlight: false,
    currency: 'NGN',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 8500,
    interval: 'monthly',
    description: 'Boost visibility with featured placement',
    features: [
      'Everything in Starter',
      'Priority listing placement',
      'In-app messaging & reminders',
      'Booking conflict detection',
    ],
    highlight: true,
    currency: 'NGN',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 95000,
    interval: 'yearly',
    description: 'Scale your business with premium tools',
    features: [
      'Everything in Growth',
      'Dedicated account support',
      'Advanced analytics & export',
      'Discount on top listing add-ons',
    ],
    highlight: false,
    currency: 'NGN',
  },
];

const ProviderSubscriptionScreen: React.FC<ProviderSubscriptionScreenProps> = ({
  userData,
  onBack,
  onNavigate,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(FALLBACK_PLANS);
  const [subscription, setSubscription] = useState<ProviderSubscription | null>(null);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);

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

  const fetchSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      const [subscriptionResponse, plansResponse, historyResponse] = await Promise.all([
        apiService.getProviderSubscription().catch(() => ({ success: false })),
        apiService.getSubscriptionPlans().catch(() => ({ success: false })),
        apiService.getProviderSubscriptionHistory().catch(() => ({ success: false })),
      ]);

      if (subscriptionResponse?.success) {
        const data = subscriptionResponse.data;
        if (data) {
          setSubscription({
            id: data.id,
            planId: data.subscriptionPlanId || data.planId,
            planName: data.SubscriptionPlan?.name || data.planName || 'Subscription',
            status: (data.status || 'inactive').toLowerCase(),
            startDate: data.currentPeriodStart || data.startDate,
            endDate: data.currentPeriodEnd || data.endDate,
            nextBillingDate: data.nextBillingDate || data.currentPeriodEnd,
            autoRenew: Boolean(data.autoRenew),
            amount:
              typeof data.amount === 'number'
                ? data.amount
                : Number.parseFloat(data.amount || data.metadata?.payment_amount || '0') || 0,
            currency: data.currency || 'NGN',
            featureLimits: data.featureLimits || data.SubscriptionPlan?.featureLimits || null,
          });
        } else {
          setSubscription(null);
        }
      } else {
        setSubscription(null);
      }

      if (plansResponse?.success && Array.isArray(plansResponse.data)) {
        const mappedPlans = plansResponse.data.map((plan: any) => ({
          id: plan.id || plan.planId,
          name: plan.name,
          price:
            typeof plan.price === 'number'
              ? plan.price
              : Number.parseFloat(plan.price || plan.metadata?.amount || '0') || 0,
          interval: plan.interval || plan.billingInterval || 'monthly',
          description: plan.description,
          features: plan.features || plan.benefits || null,
          highlight: Boolean(plan.isPopular || plan.recommended),
          currency: plan.currency || 'NGN',
          metadata: plan.metadata,
        })) as SubscriptionPlan[];
        setPlans(mappedPlans.length ? mappedPlans : FALLBACK_PLANS);
      } else {
        setPlans(FALLBACK_PLANS);
      }

      if (historyResponse?.success && Array.isArray(historyResponse.data)) {
        const mappedHistory = historyResponse.data.map((item: any) => ({
          id: item.id,
          amount:
            typeof item.amount === 'number'
              ? item.amount
              : Number.parseFloat(item.amount || item.metadata?.payment_amount || '0') || 0,
          currency: item.currency || 'NGN',
          status: (item.status || 'pending').toLowerCase(),
          date: item.createdAt || item.metadata?.payment_date,
          planName: item.SubscriptionPlan?.name || item.planName || 'Subscription',
          transactionId:
            item.metadata?.payment_reference || item.metadata?.registrationPaymentReference || item.transactionId,
        })) as PaymentHistoryItem[];
        setHistory(mappedHistory);
      } else {
        setHistory([]);
      }
    } catch (error: any) {
      console.error('Provider subscription fetch error:', error);
      Alert.alert('Subscription', error?.message || 'Unable to load subscription data right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const activePlanId = useMemo(() => subscription?.planId, [subscription]);

  const subscriptionStatus = useMemo(() => {
    const status = subscription?.status || 'inactive';
    if (status === 'active') return { label: 'Active', color: '#22c55e', bg: '#dcfce7' };
    if (status === 'trial') return { label: 'Trialing', color: '#0ea5e9', bg: '#e0f2fe' };
    if (status === 'pending') return { label: 'Pending', color: '#f59e0b', bg: '#fef3c7' };
    if (status === 'cancelled') return { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' };
    if (status === 'expired') return { label: 'Expired', color: '#ef4444', bg: '#fee2e2' };
    return { label: 'Inactive', color: '#94a3b8', bg: '#f1f5f9' };
  }, [subscription?.status]);

  const handlePlanChange = async (plan: SubscriptionPlan) => {
    if (plan.id === activePlanId) {
      Alert.alert('Current Plan', 'You are already on this subscription plan.');
      return;
    }

    Alert.alert(
      'Switch Plan',
      `Proceed to subscribe to the ${plan.name} plan for ${formatCurrency(plan.price, plan.currency)}?`,
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Continue',
          style: 'default',
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await apiService.initializeProviderSubscription(plan.id);
              if (response.success && response.data) {
                const paymentUrl =
                  response.data.authorizationUrl ||
                  response.data.authorization_url ||
                  response.data.paymentUrl ||
                  response.data.payment_url ||
                  response.data.checkoutUrl ||
                  response.data.checkout_url;

                if (paymentUrl && (await Linking.canOpenURL(paymentUrl))) {
                  await Linking.openURL(paymentUrl);
                } else {
                  Alert.alert('Payment', 'Subscription payment link generated. Please check your email to continue.');
                }
              } else {
                Alert.alert('Subscription', response.message || 'Unable to initialize subscription payment.');
              }
            } catch (error: any) {
              console.error('Plan change error:', error);
              Alert.alert('Subscription', error?.message || 'Failed to start subscription payment.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.id) {
      Alert.alert('Subscription', 'No active subscription to cancel.');
      return;
    }

    Alert.alert('Cancel Subscription', 'You will lose premium features at the end of your billing cycle. Continue?', [
      { text: 'Keep subscription', style: 'cancel' },
      {
        text: 'Cancel subscription',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(true);
            const response = await apiService.cancelProviderSubscription(subscription.id);
            if (response.success) {
              Alert.alert('Subscription', 'Your subscription cancellation request was received.');
              fetchSubscriptionData();
            } else {
              Alert.alert('Subscription', response.message || 'Unable to cancel subscription.');
            }
          } catch (error: any) {
            console.error('Cancel subscription error:', error);
            Alert.alert('Subscription', error?.message || 'Unable to cancel subscription right now.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleReactivate = async () => {
    if (!subscription?.id) {
      Alert.alert('Subscription', 'No subscription to reactivate.');
      return;
    }

    try {
      setActionLoading(true);
      const response = await apiService.reactivateProviderSubscription(subscription.id);
      if (response.success) {
        Alert.alert('Subscription', 'Subscription reactivated successfully.');
        fetchSubscriptionData();
      } else {
        Alert.alert('Subscription', response.message || 'Unable to reactivate subscription.');
      }
    } catch (error: any) {
      console.error('Reactivate subscription error:', error);
      Alert.alert('Subscription', error?.message || 'Unable to reactivate subscription right now.');
    } finally {
      setActionLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubscriptionData();
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isActive = plan.id === activePlanId;
    const isRecommended = Boolean(plan.highlight);

    return (
      <TouchableOpacity
        key={plan.id}
        style={[styles.planCard, isActive && styles.planCardActive, isRecommended && styles.planCardRecommended]}
        activeOpacity={0.85}
        onPress={() => handlePlanChange(plan)}
        disabled={actionLoading}
      >
        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>{formatCurrency(plan.price, plan.currency)}</Text>
            <Text style={styles.planInterval}>{plan.interval === 'yearly' ? 'per year' : 'per month'}</Text>
          </View>
          {isActive ? (
            <View style={styles.planStatusBadge}>
              <BadgeCheck size={16} color="#22c55e" />
              <Text style={styles.planStatusText}>Active</Text>
            </View>
          ) : (
            <ArrowRight size={18} color="#ec4899" />
          )}
        </View>

        {plan.description ? <Text style={styles.planDescription}>{plan.description}</Text> : null}

        {Array.isArray(plan.features) && plan.features.length > 0 ? (
          <View style={styles.planFeatures}>
            {plan.features.map((feature) => (
              <View key={`${plan.id}-${feature}`} style={styles.planFeatureRow}>
                <ShieldCheck size={14} color="#ec4899" />
                <Text style={styles.planFeatureText}>{feature}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {!isActive ? (
          <TouchableOpacity style={styles.planActionButton} onPress={() => handlePlanChange(plan)} disabled={actionLoading}>
            <Text style={styles.planActionButtonText}>Choose {plan.name}</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderHistoryItem = (item: PaymentHistoryItem) => {
    const statusColor =
      item.status === 'success' ? '#22c55e' : item.status === 'failed' ? '#ef4444' : '#f59e0b';

    return (
      <View key={item.id} style={styles.historyItem}>
        <View style={styles.historyIcon}>
          <Wallet size={18} color="#ec4899" />
        </View>
        <View style={styles.historyContent}>
          <Text style={styles.historyPlan}>{item.planName}</Text>
          <Text style={styles.historyMeta}>Transaction ID: {item.transactionId || '—'}</Text>
          <Text style={styles.historyMeta}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.historyAmount}>
          <Text style={styles.historyAmountText}>{formatCurrency(item.amount, item.currency)}</Text>
          <Text style={[styles.historyStatus, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
    );
  };

  const renderFeatureLimits = () => {
    const limits = subscription?.featureLimits;
    if (!limits || typeof limits !== 'object') {
      return null;
    }

    const limitEntries = Object.entries(limits);
    if (limitEntries.length === 0) {
      return null;
    }

    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Feature Limits</Text>
        <Text style={styles.sectionSubtitle}>Track the allowances included in your current subscription</Text>
        {limitEntries.map(([key, value]) => (
          <View key={key} style={styles.limitRow}>
            <Text style={styles.limitLabel}>{key.replace(/_/g, ' ')}</Text>
            <Text style={styles.limitValue}>{String(value)}</Text>
          </View>
        ))}
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
        <Text style={styles.headerTitle}>Subscription</Text>
        <TouchableOpacity
          onPress={() => onNavigate?.('provider-settings')}
          activeOpacity={0.7}
          style={styles.headerButton}
        >
          <RefreshCcw size={18} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Current Subscription</Text>
              <Text style={styles.sectionSubtitle}>Review your active plan and billing status</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: subscriptionStatus.bg }]}> 
              <Info size={14} color={subscriptionStatus.color} />
              <Text style={[styles.statusPillText, { color: subscriptionStatus.color }]}>{subscriptionStatus.label}</Text>
            </View>
          </View>

          {subscription ? (
            <View style={styles.subscriptionSummary}>
              <View style={styles.subscriptionRow}>
                <CreditCard size={18} color="#0f172a" />
                <Text style={styles.subscriptionPlan}>{subscription.planName}</Text>
              </View>
              <Text style={styles.subscriptionAmount}>{formatCurrency(subscription.amount, subscription.currency)}</Text>
              <View style={styles.subscriptionDates}>
                <View style={styles.subscriptionDateRow}>
                  <CalendarDays size={14} color="#64748b" />
                  <Text style={styles.subscriptionDateLabel}>Billing cycle:</Text>
                  <Text style={styles.subscriptionDateValue}>{formatDate(subscription.startDate)} → {formatDate(subscription.endDate)}</Text>
                </View>
                <View style={styles.subscriptionDateRow}>
                  <CalendarDays size={14} color="#64748b" />
                  <Text style={styles.subscriptionDateLabel}>Next renewal:</Text>
                  <Text style={styles.subscriptionDateValue}>{formatDate(subscription.nextBillingDate)}</Text>
                </View>
              </View>
              <View style={styles.subscriptionActions}>
                {(subscription.status === 'active' || subscription.status === 'trial') && (
                  <TouchableOpacity
                    style={[styles.subscriptionButton, styles.subscriptionButtonSecondary]}
                    onPress={handleCancelSubscription}
                    disabled={actionLoading}
                  >
                    <Text style={styles.subscriptionButtonSecondaryText}>Cancel subscription</Text>
                  </TouchableOpacity>
                )}
                {(subscription.status === 'cancelled' || subscription.status === 'expired') && (
                  <TouchableOpacity
                    style={[styles.subscriptionButton, styles.subscriptionButtonPrimary]}
                    onPress={handleReactivate}
                    disabled={actionLoading}
                  >
                    <Text style={styles.subscriptionButtonPrimaryText}>Reactivate</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateBox}>
              <CreditCard size={40} color="#cbd5f5" />
              <Text style={styles.emptyStateTitle}>No subscription yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Choose a subscription plan below to unlock premium placement and booking tools.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          <Text style={styles.sectionSubtitle}>Upgrade, downgrade, or switch billing frequency anytime</Text>
          <View style={styles.planGrid}>{plans.map(renderPlanCard)}</View>
        </View>

        {renderFeatureLimits()}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Payment History</Text>
              <Text style={styles.sectionSubtitle}>Receipts from previous subscription payments</Text>
            </View>
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Wallet size={42} color="#cbd5f5" />
              <Text style={styles.emptyStateTitle}>No payments yet</Text>
              <Text style={styles.emptyStateSubtitle}>Payments will appear here after you purchase a subscription.</Text>
            </View>
          ) : (
            history.map(renderHistoryItem)
          )}
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subscriptionSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  subscriptionPlan: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  subscriptionAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  subscriptionDates: {
    gap: 8,
    marginBottom: 16,
  },
  subscriptionDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscriptionDateLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  subscriptionDateValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  subscriptionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  subscriptionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionButtonPrimary: {
    backgroundColor: '#ec4899',
  },
  subscriptionButtonPrimaryText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  subscriptionButtonSecondary: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  subscriptionButtonSecondaryText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  emptyStateBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 10,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  planGrid: {
    gap: 14,
  },
  planCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  planCardActive: {
    borderColor: '#ec4899',
    backgroundColor: '#fff1f8',
  },
  planCardRecommended: {
    borderColor: '#6366f1',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ec4899',
  },
  planInterval: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  planStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#dcfce7',
  },
  planStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
  },
  planDescription: {
    fontSize: 13,
    color: '#475569',
    marginTop: 12,
    lineHeight: 18,
  },
  planFeatures: {
    marginTop: 12,
    gap: 6,
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planFeatureText: {
    fontSize: 13,
    color: '#475569',
  },
  planActionButton: {
    marginTop: 16,
    backgroundColor: '#ec4899',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  planActionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  limitLabel: {
    fontSize: 13,
    color: '#475569',
    textTransform: 'capitalize',
  },
  limitValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
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
  historyPlan: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  historyMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  historyAmount: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyAmountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  historyStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
});

export default ProviderSubscriptionScreen;
