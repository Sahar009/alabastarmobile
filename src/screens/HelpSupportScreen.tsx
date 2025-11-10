import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  Search,
  ChevronDown,
  ChevronUp,
  Book,
  FileText,
} from 'lucide-react-native';

interface HelpSupportScreenProps {
  userData: any;
  onBack: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({
  userData,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'How do I book a service?',
      answer: 'Search for providers on the home screen, select a category, or browse featured services. Tap on a provider to view their profile and click "Book Now" to schedule a service.',
    },
    {
      question: 'How do I cancel a booking?',
      answer: 'Go to the Bookings section in your profile, find the booking you want to cancel, and tap "Cancel". Please note cancellation policies may vary by provider.',
    },
    {
      question: 'How do I pay for services?',
      answer: 'Payment is processed securely through the app after service completion. You can add payment methods in your profile settings.',
    },
    {
      question: 'Are providers verified?',
      answer: 'Yes, all providers on Alabastar are verified and background-checked. We ensure their qualifications and credentials before they can offer services.',
    },
    {
      question: 'How do I rate a provider?',
      answer: 'After a completed booking, you\'ll be prompted to rate and review the provider. You can also rate them from the Bookings section.',
    },
    {
      question: 'What if I have an issue with a service?',
      answer: 'Contact our support team immediately through the support section or email. We\'ll work with you and the provider to resolve any issues.',
    },
  ];

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleContactSupport = (method: 'email' | 'phone') => {
    if (method === 'email') {
      Linking.openURL('mailto:support@alabastar.com?subject=Support Request').catch(
        (err) => console.error('Failed to open email:', err)
      );
    } else {
      Linking.openURL('tel:+2348000000000').catch((err) =>
        console.error('Failed to open phone:', err)
      );
    }
  };

  const FAQItem = ({ faq, index }: { faq: FAQItem; index: number }) => {
    const isExpanded = expandedFAQ === index;
    return (
      <View style={styles.faqItem}>
        <TouchableOpacity
          style={styles.faqQuestion}
          onPress={() => toggleFAQ(index)}
          activeOpacity={0.7}
        >
          <Text style={styles.faqQuestionText}>{faq.question}</Text>
          {isExpanded ? (
            <ChevronUp size={20} color="#64748b" />
          ) : (
            <ChevronDown size={20} color="#64748b" />
          )}
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.faqAnswer}>
            <Text style={styles.faqAnswerText}>{faq.answer}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Contact Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleContactSupport('email')}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#2563EB20' }]}>
              <Mail size={24} color="#2563EB" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactSubtitle}>support@alabastar.com</Text>
            </View>
            <ChevronDown size={20} color="#94a3b8" style={{ transform: [{ rotate: '-90deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleContactSupport('phone')}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#10b98120' }]}>
              <Phone size={24} color="#10b981" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Phone Support</Text>
              <Text style={styles.contactSubtitle}>+234 800 000 0000</Text>
            </View>
            <ChevronDown size={20} color="#94a3b8" style={{ transform: [{ rotate: '-90deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => {
              Alert.alert('Live Chat', 'Live chat feature coming soon');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#ec489920' }]}>
              <MessageCircle size={24} color="#ec4899" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactSubtitle}>Available 24/7</Text>
            </View>
            <ChevronDown size={20} color="#94a3b8" style={{ transform: [{ rotate: '-90deg' }] }} />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Book size={20} color="#0f172a" />
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          </View>
          
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => (
              <FAQItem key={index} faq={faq} index={index} />
            ))
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No results found</Text>
              <Text style={styles.noResultsSubtext}>
                Try searching with different keywords
              </Text>
            </View>
          )}
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => {
              Alert.alert('Terms of Service', 'Terms of Service page coming soon');
            }}
            activeOpacity={0.7}
          >
            <FileText size={20} color="#64748b" />
            <Text style={styles.linkText}>Terms of Service</Text>
            <ChevronDown size={20} color="#94a3b8" style={{ transform: [{ rotate: '-90deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => {
              Alert.alert('Privacy Policy', 'Privacy Policy page coming soon');
            }}
            activeOpacity={0.7}
          >
            <FileText size={20} color="#64748b" />
            <Text style={styles.linkText}>Privacy Policy</Text>
            <ChevronDown size={20} color="#94a3b8" style={{ transform: [{ rotate: '-90deg' }] }} />
          </TouchableOpacity>
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
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#0f172a',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  faqItem: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    paddingTop: 12,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    marginLeft: 12,
  },
});

export default HelpSupportScreen;





