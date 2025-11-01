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
  ImageBackground,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Shield,
  Star,
  Zap,
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

const heroImage = require('../../assets/provider-signin-bg.jpg');

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

  const features = [
    { icon: Shield, label: 'Secure & Verified' },
    { icon: Star, label: '5-Star Rated Platform' },
    { icon: Zap, label: 'Instant Access' },
  ];

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
    } catch (error) {
      console.error('Provider sign in failed:', error);
      Alert.alert('Sign In Failed', 'We could not sign you in. Please verify your credentials and try again.');
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
            <ArrowLeft size={18} color="#0f172a" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.heroWrapper}>
            <ImageBackground
              source={heroImage}
              style={styles.heroImage}
              imageStyle={styles.heroImageStyle}
            >
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <View style={styles.heroLogo}>
                  <Text style={styles.heroLogoText}>ALABASTAR PRO</Text>
                </View>
                <Text style={styles.heroTitle}>Welcome Back, Provider!</Text>
                <Text style={styles.heroSubtitle}>
                  Manage your bookings, showcase your expertise, and grow with Alabastar.
                </Text>
              </View>
            </ImageBackground>

            <View style={styles.featuresContainer}>
              {features.map((feature, index) => (
                <View key={feature.label} style={styles.featureCard}>
                  <View style={styles.featureIcon}>
                    <feature.icon size={18} color="#ffffff" />
                  </View>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                </View>
              ))}
            </View>
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
    gap: 6,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  heroWrapper: {
    marginHorizontal: 20,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  heroImage: {
    height: 220,
    justifyContent: 'flex-end',
  },
  heroImageStyle: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  heroContent: {
    padding: 24,
  },
  heroLogo: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
  },
  heroLogoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#ffffff',
  },
  featureCard: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#fdf2f8',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 10,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ec4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
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

