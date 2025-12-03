import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface UserTypeSelectionScreenProps {
  onUserTypeSelected: (type: 'user' | 'provider') => void;
}

const UserTypeSelectionScreen: React.FC<UserTypeSelectionScreenProps> = ({ 
  onUserTypeSelected 
}) => {
  const [selectedType, setSelectedType] = useState<'user' | 'provider' | null>(null);

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

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
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
              {/* Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={require('../../assets/userselect.png')}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
                {selectedType === 'user' && (
                  <View style={styles.imageOverlay} />
                )}
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
              {/* Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={require('../../assets/providerselect.png')}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
                {selectedType === 'provider' && (
                  <View style={styles.imageOverlay} />
                )}
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
              <Text style={styles.continueButtonText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    backgroundColor: '#fdf2f8',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.08,
  },
  circle1: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: '#ec4899',
    top: -width * 0.3,
    right: -width * 0.2,
  },
  circle2: {
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: '#f97316',
    bottom: -width * 0.2,
    left: -width * 0.3,
  },
  circle3: {
    width: width * 0.4,
    height: width * 0.4,
    backgroundColor: '#ec4899',
    top: height * 0.35,
    right: width * 0.15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  logoContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 160,
    height: 64,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    marginVertical: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: '#ec4899',
    borderWidth: 3,
    shadowColor: '#ec4899',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  cardContent: {
    padding: 16,
    position: 'relative',
    alignItems: 'center',
  },
  imageContainer: {
    width: width * 0.7,
    height: height * 0.2,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardTitleSelected: {
    color: '#ec4899',
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    backgroundColor: '#ec4899',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ec4899',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
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
    marginTop: 10,
    marginBottom: 10,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flex: 1,
    maxWidth: 120,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 15,
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
    flex: 1,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default UserTypeSelectionScreen;
