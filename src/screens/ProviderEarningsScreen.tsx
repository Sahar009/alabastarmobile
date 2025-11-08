import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  Gift,
  Banknote,
  Receipt,
  Info,
  X,
  Search,
  Filter,
} from 'lucide-react-native';
import { apiService } from '../services/api';

interface ProviderEarningsScreenProps {
  userData: any;
  onNavigate?: (screen: string) => void;
}

interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'credit' | 'debit';
  amount: string;
  reference: string;
  description: string;
  balanceAfter: string;
  metadata: {
    status?: 'completed' | 'pending' | 'failed';
    transactionType?: 'withdrawal' | 'earning' | 'commission' | 'refund';
    withdrawalMethod?: string;
    refundReason?: string;
    originalReference?: string;
    bankDetails?: {
      bankName: string;
      accountName: string;
      accountNumber: string;
    };
    [key: string]: any;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: string;
  type: 'earning' | 'withdrawal' | 'refund' | 'commission';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  reference: string;
  date: string;
  customer?: string;
  bookingId?: string;
  balanceAfter?: number;
}

interface EarningStats {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  availableBalance: number;
  pendingEarnings: number;
  totalWithdrawals: number;
  commissionEarned: number;
  wallet?: {
    balance: number | string;
    currency: string;
    totalCredits: number | string;
    totalDebits: number | string;
    netAmount: number | string;
    recentTransactions: WalletTransaction[];
  };
}

interface Bank {
  code: string;
  name: string;
}

const ProviderEarningsScreen: React.FC<ProviderEarningsScreenProps> = ({ onNavigate: _onNavigate, userData: _userData }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<EarningStats>({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    availableBalance: 0,
    pendingEarnings: 0,
    totalWithdrawals: 0,
    commissionEarned: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankAccount, setBankAccount] = useState({
    accountNumber: '',
    bankName: '',
    accountName: '',
  });
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);
  const [verifiedAccountName, setVerifiedAccountName] = useState('');

  const formatCurrency = useCallback((amount: number) => {
    try {
      return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
    } catch {
      return `₦${amount.toFixed(0)}`;
    }
  }, []);

  // Helper to parse wallet balance (handles both string and number)
  const getWalletBalance = useCallback(() => {
    const balance = stats.wallet?.balance || stats.availableBalance || 0;
    return typeof balance === 'string' ? parseFloat(balance) : balance;
  }, [stats]);

  const fetchEarningsStats = useCallback(async () => {
    try {
      await apiService.loadToken();
      const response = await apiService.getEarningsStats();

      if (response.success && response.data) {
        // Parse wallet balance (may be string or number)
        const walletBalance = response.data.wallet?.balance 
          ? (typeof response.data.wallet.balance === 'string' 
              ? parseFloat(response.data.wallet.balance) 
              : response.data.wallet.balance)
          : response.data.availableBalance || 0;
        setStats({
          ...response.data,
          availableBalance: walletBalance,
        });
        
        // Transform wallet transactions to Transaction format
        const walletTransactions = response.data.wallet?.recentTransactions || [];
        const transformedTransactions: Transaction[] = walletTransactions.map((walletTx: WalletTransaction) => {
          // Determine transaction type from metadata or wallet type
          let transactionType: 'earning' | 'withdrawal' | 'refund' | 'commission' = 'earning';
          
          if (walletTx.metadata?.transactionType) {
            transactionType = walletTx.metadata.transactionType as 'earning' | 'withdrawal' | 'refund' | 'commission';
          } else if (walletTx.type === 'debit') {
            transactionType = 'withdrawal';
          } else if (walletTx.description.toLowerCase().includes('refund')) {
            transactionType = 'refund';
          } else if (walletTx.description.toLowerCase().includes('commission') || walletTx.description.toLowerCase().includes('referral')) {
            transactionType = 'commission';
          } else {
            transactionType = 'earning';
          }
          
          // Determine status from metadata or default
          let status: 'completed' | 'pending' | 'failed' = 'completed';
          if (walletTx.metadata?.status) {
            status = walletTx.metadata.status;
          } else if (walletTx.description.toLowerCase().includes('failed')) {
            status = 'failed';
          } else if (walletTx.description.toLowerCase().includes('pending')) {
            status = 'pending';
          }
          
          // Amount: positive for credit, negative for debit
          const amount = walletTx.type === 'credit' 
            ? parseFloat(walletTx.amount) 
            : -parseFloat(walletTx.amount);
          
          return {
            id: walletTx.id,
            type: transactionType,
            amount,
            status,
            description: walletTx.description,
            reference: walletTx.reference,
            date: walletTx.createdAt,
            balanceAfter: parseFloat(walletTx.balanceAfter),
          };
        });
        
        // Apply filters to transformed transactions
        let filtered = transformedTransactions;
        
        if (filter !== 'all') {
          filtered = filtered.filter(tx => tx.type === filter);
        }
        
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          filtered = filtered.filter(tx => 
            tx.description.toLowerCase().includes(searchLower) ||
            tx.reference.toLowerCase().includes(searchLower)
          );
        }
        
        // Apply date range filter
        if (dateRange !== 'all') {
          const now = new Date();
          let startDate: Date;
          
          switch (dateRange) {
            case 'today':
              startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              break;
            case 'week':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              break;
            case 'quarter':
              startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
              break;
            case 'year':
              startDate = new Date(now.getFullYear(), 0, 1);
              break;
            default:
              startDate = new Date(0);
          }
          
          filtered = filtered.filter(tx => new Date(tx.date) >= startDate);
        }
        
        setTransactions(filtered);
      } else {
        console.error('Failed to fetch earnings stats:', response.message);
        setTransactions([]);
      }
    } catch (error: any) {
      console.error('Error fetching earnings stats:', error);
      setTransactions([]);
    }
  }, [filter, dateRange, searchTerm]);

  useEffect(() => {
    setLoading(true);
    fetchEarningsStats().finally(() => {
      setLoading(false);
      setRefreshing(false);
    });
  }, [fetchEarningsStats]);

  // Debounce search - transactions are filtered in fetchEarningsStats
  // This effect triggers a re-fetch when search term changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        setLoading(true);
        fetchEarningsStats().finally(() => {
          setLoading(false);
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchEarningsStats]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setLoading(true);
    fetchEarningsStats().finally(() => {
      setLoading(false);
      setRefreshing(false);
    });
  }, [fetchEarningsStats]);

  const fetchBanks = useCallback(async () => {
    try {
      setLoadingBanks(true);
      await apiService.loadToken();
      const response = await apiService.getBanks();

      if (response.success && response.data) {
        setBanks(response.data);
      } else {
        Alert.alert('Error', 'Failed to load banks list');
      }
    } catch (error: any) {
      console.error('Error fetching banks:', error);
      Alert.alert('Error', 'Error loading banks');
    } finally {
      setLoadingBanks(false);
    }
  }, []);

  useEffect(() => {
    if (showWithdrawalModal && banks.length === 0) {
      fetchBanks();
    }
  }, [showWithdrawalModal, banks.length, fetchBanks]);

  const verifyAccount = useCallback(async (accountNumber: string, bankCode: string) => {
    if (!accountNumber || !bankCode) return;

    try {
      setVerifyingAccount(true);
      await apiService.loadToken();
      const response = await apiService.verifyAccount(accountNumber, bankCode);

      if (response.success && response.data) {
        setAccountVerified(true);
        setVerifiedAccountName(response.data.account_name);
        setBankAccount(prev => ({
          ...prev,
          accountName: response.data.account_name,
        }));
      } else {
        setAccountVerified(false);
        setVerifiedAccountName('');
        Alert.alert('Error', response.message || 'Account verification failed');
      }
    } catch (error: any) {
      console.error('Error verifying account:', error);
      setAccountVerified(false);
      setVerifiedAccountName('');
      Alert.alert('Error', 'Error verifying account');
    } finally {
      setVerifyingAccount(false);
    }
  }, []);

  const handleBankChange = useCallback((bankName: string) => {
    setBankAccount(prev => ({ ...prev, bankName }));
    setAccountVerified(false);
    setVerifiedAccountName('');
  }, []);

  const handleAccountNumberChange = useCallback((accountNumber: string) => {
    setBankAccount(prev => ({ ...prev, accountNumber }));
    setAccountVerified(false);
    setVerifiedAccountName('');

    // Auto-verify when both bank and account number are provided
    if (accountNumber.length === 10 && bankAccount.bankName) {
      const selectedBank = banks.find(bank => bank.name === bankAccount.bankName);
      if (selectedBank) {
        verifyAccount(accountNumber, selectedBank.code);
      }
    }
  }, [bankAccount.bankName, banks, verifyAccount]);

  const handleWithdrawal = useCallback(async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const availableBalance = getWalletBalance();
    if (parseFloat(withdrawalAmount) > availableBalance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    if (!bankAccount.accountNumber || !bankAccount.bankName || !bankAccount.accountName) {
      Alert.alert('Error', 'Please provide complete bank details');
      return;
    }

    try {
      setProcessingWithdrawal(true);
      await apiService.loadToken();
      const response = await apiService.requestWithdrawal({
        amount: parseFloat(withdrawalAmount),
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        accountName: bankAccount.accountName,
      });

      if (response.success) {
        Alert.alert('Success', 'Withdrawal request submitted successfully!');
        setShowWithdrawalModal(false);
        setWithdrawalAmount('');
        setBankAccount({
          accountNumber: '',
          bankName: '',
          accountName: '',
        });
        setAccountVerified(false);
        setVerifiedAccountName('');
        await fetchEarningsStats();
      } else {
        Alert.alert('Error', response.message || 'Failed to process withdrawal');
      }
    } catch (error: any) {
      console.error('Error processing withdrawal:', error);
      Alert.alert('Error', 'Error processing withdrawal');
    } finally {
      setProcessingWithdrawal(false);
    }
  }, [withdrawalAmount, bankAccount, fetchEarningsStats, getWalletBalance]);

  const monthlyGrowth = useMemo(() => {
    return stats.lastMonth > 0
      ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100
      : 0;
  }, [stats.thisMonth, stats.lastMonth]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earning':
        return <ArrowDownRight size={18} color="#10b981" />;
      case 'withdrawal':
        return <ArrowUpRight size={18} color="#2563eb" />;
      case 'commission':
        return <Gift size={18} color="#7c3aed" />;
      case 'refund':
        return <XCircle size={18} color="#ef4444" />;
      default:
        return <DollarSign size={18} color="#6366f1" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'earning':
        return '#10b981';
      case 'withdrawal':
        return '#2563eb';
      case 'commission':
        return '#7c3aed';
      case 'refund':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Wallet size={24} color="#ffffff" />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Earnings & Payouts</Text>
            <Text style={styles.headerSubtitle}>Track your revenue and manage withdrawals</Text>
          </View>
          <TouchableOpacity onPress={handleRefresh} disabled={refreshing} style={styles.refreshButton}>
            <Calendar size={20} color="#ec4899" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {/* Stats Overview */}
          <View style={styles.statsGrid}>
            {/* Total Earnings */}
            <View style={styles.statCardPrimary}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statLabel}>Total Earnings</Text>
                <View style={styles.statIconContainer}>
                  <DollarSign size={20} color="#fef3c7" />
                </View>
              </View>
              <Text style={styles.statValue}>{formatCurrency(stats.totalEarnings)}</Text>
              <View style={styles.statTrend}>
                <TrendingUp size={14} color="#10b981" />
                <Text style={styles.statTrendText}>All time</Text>
              </View>
            </View>

            {/* This Month */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statLabel}>This Month</Text>
                <View style={[styles.statIconContainer, styles.statIconPink]}>
                  <Calendar size={18} color="#ec4899" />
                </View>
              </View>
              <Text style={[styles.statValueSmall, styles.statValuePink]}>{formatCurrency(stats.thisMonth)}</Text>
              <View style={styles.statTrend}>
                {monthlyGrowth >= 0 ? (
                  <>
                    <TrendingUp size={14} color="#10b981" />
                    <Text style={[styles.statTrendText, styles.statTrendGreen]}>
                      +{monthlyGrowth.toFixed(1)}% from last month
                    </Text>
                  </>
                ) : (
                  <>
                    <TrendingDown size={14} color="#ef4444" />
                    <Text style={[styles.statTrendText, styles.statTrendRed]}>
                      {monthlyGrowth.toFixed(1)}% from last month
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Pending Earnings */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statLabel}>Pending</Text>
                <View style={[styles.statIconContainer, styles.statIconAmber]}>
                  <Clock size={18} color="#f59e0b" />
                </View>
              </View>
              <Text style={[styles.statValueSmall, styles.statValueAmber]}>{formatCurrency(stats.pendingEarnings)}</Text>
              <Text style={styles.statHint}>Available after service completion</Text>
            </View>

            {/* Wallet Balance */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statLabel}>Wallet Balance</Text>
                <View style={[styles.statIconContainer, styles.statIconPurple]}>
                  <Wallet size={18} color="#7c3aed" />
                </View>
              </View>
              <Text style={[styles.statValueSmall, styles.statValuePurple]}>
                {formatCurrency(getWalletBalance())}
              </Text>
              <TouchableOpacity
                style={styles.withdrawButtonSmall}
                onPress={() => setShowWithdrawalModal(true)}
                disabled={getWalletBalance() <= 0}
              >
                <Text style={styles.withdrawButtonSmallText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Stats */}
          <View style={styles.additionalStats}>
            <View style={styles.additionalStatCard}>
              <Banknote size={20} color="#2563eb" />
              <Text style={styles.additionalStatLabel}>Total Withdrawals</Text>
              <Text style={styles.additionalStatValue}>{formatCurrency(stats.totalWithdrawals)}</Text>
            </View>
            <View style={styles.additionalStatCard}>
              <Gift size={20} color="#7c3aed" />
              <Text style={styles.additionalStatLabel}>Referral Commissions</Text>
              <Text style={styles.additionalStatValue}>{formatCurrency(stats.commissionEarned)}</Text>
            </View>
            <View style={styles.additionalStatCard}>
              <Calendar size={20} color="#64748b" />
              <Text style={styles.additionalStatLabel}>Last Month</Text>
              <Text style={styles.additionalStatValue}>{formatCurrency(stats.lastMonth)}</Text>
            </View>
          </View>

          {/* Filters and Search */}
          <View style={styles.filtersContainer}>
            <View style={styles.searchContainer}>
              <Search size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search transactions..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={styles.filterRow}>
              <View style={styles.filterSelectContainer}>
                <Filter size={16} color="#64748b" />
                <View style={styles.selectWrapper}>
                  <Text style={styles.selectLabel}>Type:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectScroll}>
                    {['all', 'earning', 'withdrawal', 'commission', 'refund'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.filterChip, filter === type && styles.filterChipActive]}
                        onPress={() => setFilter(type)}
                      >
                        <Text style={[styles.filterChipText, filter === type && styles.filterChipTextActive]}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              <View style={styles.dateRangeContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['all', 'today', 'week', 'month', 'quarter', 'year'].map((range) => (
                    <TouchableOpacity
                      key={range}
                      style={[styles.dateRangeChip, dateRange === range && styles.dateRangeChipActive]}
                      onPress={() => setDateRange(range)}
                    >
                      <Text style={[styles.dateRangeChipText, dateRange === range && styles.dateRangeChipTextActive]}>
                        {range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transaction History</Text>
              <Text style={styles.transactionCount}>{transactions.length} transactions</Text>
            </View>

            {loading && transactions.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ec4899" />
              </View>
            ) : transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Receipt size={48} color="#cbd5f5" />
                <Text style={styles.emptyStateTitle}>No transactions found</Text>
                <Text style={styles.emptyStateSubtitle}>
                  {searchTerm || filter !== 'all'
                    ? 'Try adjusting your filters to find what you\'re looking for.'
                    : 'Your transaction history will appear here once you start earning.'}
                </Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {transactions.map((transaction) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={[styles.transactionIcon, { backgroundColor: `${getTypeColor(transaction.type)}20` }]}>
                      {getTransactionIcon(transaction.type)}
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle} numberOfLines={2} ellipsizeMode="tail">
                        {transaction.description}
                      </Text>
                      <View style={styles.transactionMeta}>
                        <Receipt size={12} color="#64748b" />
                        <Text style={styles.transactionReference} numberOfLines={1} ellipsizeMode="middle">
                          {transaction.reference}
                        </Text>
                        <Text style={styles.transactionSeparator}>•</Text>
                        <Text style={styles.transactionDate} numberOfLines={1}>
                          {new Date(transaction.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.transactionAmountContainer}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          transaction.amount > 0 ? styles.amountPositive : styles.amountNegative,
                        ]}
                        numberOfLines={1}
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(transaction.status)}20` }]}>
                        {transaction.status === 'completed' && <CheckCircle size={12} color={getStatusColor(transaction.status)} />}
                        {transaction.status === 'pending' && <Clock size={12} color={getStatusColor(transaction.status)} />}
                        {transaction.status === 'failed' && <XCircle size={12} color={getStatusColor(transaction.status)} />}
                        <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]} numberOfLines={1}>
                          {transaction.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Withdrawal Modal */}
        <Modal visible={showWithdrawalModal} transparent animationType="slide" onRequestClose={() => setShowWithdrawalModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalIcon}>
                    <Banknote size={24} color="#2563eb" />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>Withdraw Funds</Text>
                    <Text style={styles.modalSubtitle}>
                      Available: {formatCurrency(getWalletBalance())}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowWithdrawalModal(false)} style={styles.modalCloseButton}>
                  <X size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Amount to Withdraw *</Text>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.currencySymbol}>₦</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={withdrawalAmount}
                      onChangeText={setWithdrawalAmount}
                      placeholder="0.00"
                      keyboardType="numeric"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => setWithdrawalAmount(getWalletBalance().toString())}
                    style={styles.withdrawAllButton}
                  >
                    <Text style={styles.withdrawAllText}>Withdraw all available balance</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Bank Name *</Text>
                  <ScrollView style={styles.bankSelectContainer}>
                    {loadingBanks ? (
                      <ActivityIndicator size="small" color="#ec4899" />
                    ) : (
                      banks.map((bank) => (
                        <TouchableOpacity
                          key={bank.code}
                          style={[styles.bankOption, bankAccount.bankName === bank.name && styles.bankOptionSelected]}
                          onPress={() => handleBankChange(bank.name)}
                        >
                          <Text style={[styles.bankOptionText, bankAccount.bankName === bank.name && styles.bankOptionTextSelected]}>
                            {bank.name}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Account Number *</Text>
                  <View style={styles.accountInputContainer}>
                    <TextInput
                      style={styles.accountInput}
                      value={bankAccount.accountNumber}
                      onChangeText={handleAccountNumberChange}
                      placeholder="0123456789"
                      maxLength={10}
                      keyboardType="numeric"
                      placeholderTextColor="#94a3b8"
                    />
                    {verifyingAccount && <ActivityIndicator size="small" color="#2563eb" style={styles.verifyIndicator} />}
                    {accountVerified && !verifyingAccount && (
                      <CheckCircle size={20} color="#10b981" style={styles.verifyIndicator} />
                    )}
                  </View>
                  {accountVerified && verifiedAccountName && (
                    <View style={styles.verifiedAccountInfo}>
                      <CheckCircle size={16} color="#10b981" />
                      <Text style={styles.verifiedAccountText}>Account verified: {verifiedAccountName}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Account Name *</Text>
                  <TextInput
                    style={[styles.accountNameInput, accountVerified && styles.accountNameInputDisabled]}
                    value={bankAccount.accountName}
                    onChangeText={(text) => setBankAccount(prev => ({ ...prev, accountName: text }))}
                    placeholder={accountVerified ? verifiedAccountName : 'Full name as registered'}
                    editable={!accountVerified}
                    placeholderTextColor="#94a3b8"
                  />
                  {accountVerified && (
                    <Text style={styles.verifiedHint}>Account name verified automatically</Text>
                  )}
                </View>

                <View style={styles.infoBox}>
                  <Info size={20} color="#2563eb" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>Processing Time</Text>
                    <Text style={styles.infoText}>Withdrawals are typically processed within 1-2 business days.</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowWithdrawalModal(false)}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSubmit]}
                  onPress={handleWithdrawal}
                  disabled={
                    processingWithdrawal ||
                    !accountVerified ||
                    !bankAccount.bankName ||
                    !bankAccount.accountNumber ||
                    !bankAccount.accountName
                  }
                >
                  {processingWithdrawal ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : !accountVerified ? (
                    <Text style={styles.modalButtonSubmitText}>Verify Account First</Text>
                  ) : (
                    <Text style={styles.modalButtonSubmitText}>Submit Withdrawal</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#ec4899',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  scrollArea: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCardPrimary: {
    width: '48%',
    borderRadius: 20,
    backgroundColor: '#1f2937',
    padding: 18,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 8 },
  },
  statCard: {
    width: '48%',
    borderRadius: 20,
    backgroundColor: '#ffffff',
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconPink: {
    backgroundColor: '#fdf2f8',
  },
  statIconAmber: {
    backgroundColor: '#fef3c7',
  },
  statIconPurple: {
    backgroundColor: '#f3e8ff',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fef3c7',
    marginBottom: 8,
  },
  statValueSmall: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  statValuePink: {
    color: '#ec4899',
  },
  statValueAmber: {
    color: '#f59e0b',
  },
  statValuePurple: {
    color: '#7c3aed',
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statTrendText: {
    fontSize: 11,
    color: '#64748b',
  },
  statTrendGreen: {
    color: '#10b981',
  },
  statTrendRed: {
    color: '#ef4444',
  },
  statHint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  withdrawButtonSmall: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    alignItems: 'center',
  },
  withdrawButtonSmallText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  additionalStatCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  additionalStatLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  additionalStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  filterRow: {
    gap: 12,
  },
  filterSelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectWrapper: {
    flex: 1,
  },
  selectLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '600',
  },
  selectScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  filterChipText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  dateRangeContainer: {
    flexDirection: 'row',
  },
  dateRangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateRangeChipActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  dateRangeChipText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  dateRangeChipTextActive: {
    color: '#ffffff',
  },
  transactionsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  transactionCount: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 80,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  transactionInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
    lineHeight: 20,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  transactionReference: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'monospace',
    maxWidth: 100,
  },
  transactionSeparator: {
    fontSize: 11,
    color: '#64748b',
  },
  transactionDate: {
    fontSize: 11,
    color: '#64748b',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: 6,
    flexShrink: 0,
    minWidth: 100,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  amountPositive: {
    color: '#10b981',
  },
  amountNegative: {
    color: '#ef4444',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    paddingVertical: 12,
  },
  withdrawAllButton: {
    marginTop: 8,
  },
  withdrawAllText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  bankSelectContainer: {
    maxHeight: 200,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
  },
  bankOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#ffffff',
  },
  bankOptionSelected: {
    backgroundColor: '#ec4899',
  },
  bankOptionText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  bankOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  accountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
  },
  accountInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 12,
    fontFamily: 'monospace',
  },
  verifyIndicator: {
    marginLeft: 8,
  },
  verifiedAccountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  verifiedAccountText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '600',
  },
  accountNameInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  accountNameInputDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.7,
  },
  verifiedHint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  modalButtonCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  modalButtonSubmit: {
    backgroundColor: '#2563eb',
  },
  modalButtonSubmitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ProviderEarningsScreen;