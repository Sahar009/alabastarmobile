import React, { useState } from 'react';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react-native';

interface ProviderAuthScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onBack: () => void;
  onJoinProvider?: () => void;
  onForgotPassword?: () => void;
}


const ProviderAuthScreen: React.FC<ProviderAuthScreenProps> = ({
  onLogin,
  onBack,
  onJoinProvider,
  onForgotPassword,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      Alert.alert('Coming Soon', 'Provider password reset will be available shortly.');
    }
  };

  const handleJoinProvider = () => {
    if (onJoinProvider) {
      onJoinProvider();
    } else {
      Alert.alert('Become a Provider', 'Provider onboarding is coming soon. Please check back later.');
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Sign In', 'Please provide both email and password to continue.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await onLogin(email.trim(), password);
    } catch (error: any) {
      console.error('Provider sign in failed:', error);
      // Show the actual error message from the API
      const errorMessage = error?.message || 'We could not sign you in. Please verify your credentials and try again.';
      Alert.alert(
        'Sign In Failed', 
        errorMessage,
        [
          {
            text: 'OK',
            style: 'default',
          },
          ...(errorMessage.includes('not registered as a provider') || errorMessage.includes('not a provider account') 
            ? [{
                text: 'Register as Provider',
                style: 'default',
                onPress: () => {
                  // Navigate to provider registration if available
                  if (onJoinProvider) {
                    onJoinProvider();
                  }
                },
              }]
            : []
          ),
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
            <ArrowLeft size={20} color="#0f172a" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.welcomeTitle}>Welcome Back, Provider!</Text>
            <Text style={styles.welcomeSubtitle}>
              Sign in to manage your bookings and grow your business
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Provider Sign In</Text>
            <Text style={styles.formSubtitle}>
              Access your provider tools, manage bookings, and connect with customers.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#ec4899" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#ec4899" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#94a3b8" />
                  ) : (
                    <Eye size={18} color="#94a3b8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.metaRow}>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.metaAction}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Signing In…' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footerTextWrapper}>
              <Text style={styles.footerText}>New to Alabastar?</Text>
              <TouchableOpacity onPress={handleJoinProvider}>
                <Text style={styles.footerLink}>Become a provider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  logoImage: {
    width: 180,
    height: 80,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  formCard: {
    marginTop: 28,
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: '#f8fafc',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  eyeButton: {
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 18,
  },
  metaAction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ec4899',
  },
  submitButton: {
    backgroundColor: '#ec4899',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerTextWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: '#64748b',
  },
  footerLink: {
    fontSize: 13,
    color: '#ec4899',
    fontWeight: '700',
  },
});

export default ProviderAuthScreen;

