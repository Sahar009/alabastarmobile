import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Calendar, Briefcase, Upload, Wallet } from 'lucide-react-native';

const { height } = Dimensions.get('window');

interface UserTypeSelectionScreenProps {
  onUserTypeSelected: (type: 'user' | 'provider') => void;
}

const UserTypeSelectionScreen: React.FC<UserTypeSelectionScreenProps> = ({ 
  onUserTypeSelected 
}) => {
  const [selectedType, setSelectedType] = useState<'user' | 'provider' | null>(null);

  const userFeatures = [
    { icon: Search, text: 'Search for providers' },
    { icon: Calendar, text: 'Easy booking' }
  ];

  const providerFeatures = [
    { icon: Upload, text: 'Upload services' },
    { icon: Wallet, text: 'Earn in Naira (₦)' }
  ];

  const handleTypeSelection = (type: 'user' | 'provider') => {
    setSelectedType(type);
  };

  const handleContinue = () => {
    if (selectedType) {
      onUserTypeSelected(selectedType);
    }
  };

  const handleBack = () => {
    setSelectedType(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient */}
      <View style={styles.backgroundGradient}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>ALABASTAR</Text>
          </View>
          <Text style={styles.title}>Welcome to Alabastar</Text>
          <Text style={styles.subtitle}>
            Choose your role to continue
          </Text>
        </View>

        {/* Selection Cards */}
        <View style={styles.cardsContainer}>
          {/* User Card */}
          <TouchableOpacity
            style={[
              styles.card,
              selectedType === 'user' && styles.cardSelected
            ]}
            onPress={() => handleTypeSelection('user')}
            activeOpacity={0.8}
          >
            <View style={styles.cardContent}>
              {/* Icon */}
              <View style={[
                styles.iconContainer,
                selectedType === 'user' && styles.iconContainerSelected
              ]}>
                <Text style={styles.iconEmoji}>👥</Text>
              </View>

              {/* Title */}
              <Text style={[
                styles.cardTitle,
                selectedType === 'user' && styles.cardTitleSelected
              ]}>
                I'm a Customer
              </Text>

              {/* Description */}
              <Text style={styles.cardDescription}>
                Search for providers and book services
              </Text>

              {/* Features */}
              <View style={styles.featuresContainer}>
                {userFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={[
                      styles.featureIcon,
                      selectedType === 'user' && styles.featureIconSelected
                    ]}>
                      <feature.icon size={16} color="#ec4899" />
                    </View>
                    <Text style={[
                      styles.featureText,
                      selectedType === 'user' && styles.featureTextSelected
                    ]}>
                      {feature.text}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Selection indicator */}
              {selectedType === 'user' && (
                <View style={styles.selectionIndicator}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Provider Card */}
          <TouchableOpacity
            style={[
              styles.card,
              selectedType === 'provider' && styles.cardSelected
            ]}
            onPress={() => handleTypeSelection('provider')}
            activeOpacity={0.8}
          >
            <View style={styles.cardContent}>
              {/* Icon */}
              <View style={[
                styles.iconContainer,
                selectedType === 'provider' && styles.iconContainerSelected
              ]}>
                <Briefcase size={32} color="#ec4899" />
              </View>

              {/* Title */}
              <Text style={[
                styles.cardTitle,
                selectedType === 'provider' && styles.cardTitleSelected
              ]}>
                I'm a Provider
              </Text>

              {/* Description */}
              <Text style={styles.cardDescription}>
                Upload services and earn money
              </Text>

              {/* Features */}
              <View style={styles.featuresContainer}>
                {providerFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={[
                      styles.featureIcon,
                      selectedType === 'provider' && styles.featureIconSelected
                    ]}>
                      <feature.icon size={16} color="#ec4899" />
                    </View>
                    <Text style={[
                      styles.featureText,
                      selectedType === 'provider' && styles.featureTextSelected
                    ]}>
                      {feature.text}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Selection indicator */}
              {selectedType === 'provider' && (
                <View style={styles.selectionIndicator}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        {selectedType && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Continue to Sign In →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text style={styles.footerLink}>Become a Provider</Text>
            {' '}or{' '}
            <Text style={styles.footerLink}>Register as Customer</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fdf2f8', // Light pink background
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.1,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: '#ec4899', // Pink-500
    top: -100,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: '#f97316', // Orange-500
    bottom: 100,
    left: -75,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: '#ec4899', // Pink-500
    top: height * 0.3,
    right: 50,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  logoContainer: {
    marginBottom: 15,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ec4899',
    letterSpacing: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardSelected: {
    borderColor: '#ec4899',
    shadowColor: '#ec4899',
    shadowOpacity: 0.25,
    transform: [{ scale: 1.02 }],
  },
  cardContent: {
    padding: 20,
    position: 'relative',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  iconContainerSelected: {
    backgroundColor: '#ec4899',
    shadowColor: '#ec4899',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconEmoji: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardTitleSelected: {
    color: '#ec4899',
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  featuresContainer: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIconSelected: {
    backgroundColor: '#fdf2f8',
  },
  featureIconText: {
    fontSize: 16,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    flex: 1,
  },
  featureTextSelected: {
    color: '#374151',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    backgroundColor: '#ec4899',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  continueButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#ec4899',
    borderRadius: 12,
    shadowColor: '#ec4899',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLink: {
    color: '#ec4899',
    fontWeight: '600',
  },
});

export default UserTypeSelectionScreen;
