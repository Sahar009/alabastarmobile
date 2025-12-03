import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Info,
  Mail,
  Globe,
  Heart,
  Code,
  Shield,
  Award,
} from 'lucide-react-native';

interface AboutScreenProps {
  userData: any;
  onBack: () => void;
}

const AboutScreen: React.FC<AboutScreenProps> = ({
  userData,
  onBack,
}) => {
  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* App Info Section */}
        <View style={styles.section}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Info size={48} color="#ec4899" />
            </View>
            <Text style={styles.appName}>Alabastar</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
          </View>

          <Text style={styles.description}>
            Alabastar connects you with trusted service providers in your area. 
            Find reliable professionals for plumbing, electrical work, cleaning, 
            and more, all at your fingertips.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          
          <View style={styles.featureItem}>
            <Shield size={20} color="#10b981" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Verified Providers</Text>
              <Text style={styles.featureDescription}>
                All providers are verified and background-checked for your safety
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Award size={20} color="#f59e0b" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Quality Service</Text>
              <Text style={styles.featureDescription}>
                Connect with experienced professionals in your area
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Heart size={20} color="#ef4444" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Customer First</Text>
              <Text style={styles.featureDescription}>
                Your satisfaction is our top priority
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleOpenLink('mailto:support@alabastar.ng')}
          >
            <Mail size={20} color="#2563EB" />
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>support@alabastar.ng</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleOpenLink('https://alabastar.ng')}
          >
            <Globe size={20} color="#10b981" />
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Website</Text>
              <Text style={styles.contactValue}>www.alabastar.ng</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Developer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer</Text>
          
          <View style={styles.developerItem}>
            <Code size={20} color="#8b5cf6" />
            <View style={styles.developerContent}>
              <Text style={styles.developerLabel}>Made with</Text>
              <View style={styles.heartContainer}>
                <Heart size={16} color="#ef4444" fill="#ef4444" />
                <Text style={styles.developerValue}>by Alabastar Team</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#ec4899',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#64748b',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  contactContent: {
    flex: 1,
    marginLeft: 12,
  },
  contactLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
  },
  developerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  developerContent: {
    flex: 1,
    marginLeft: 12,
  },
  developerLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  heartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  developerValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
  },
});

export default AboutScreen;





















