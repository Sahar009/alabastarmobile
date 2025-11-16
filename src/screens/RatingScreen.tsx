import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, X, Send } from 'lucide-react-native';
import { apiService } from '../services/api';

interface RatingScreenProps {
  isVisible: boolean;
  booking: any;
  onClose: () => void;
  onSuccess: (rating: number, comment?: string) => void;
}

const RatingScreen: React.FC<RatingScreenProps> = ({
  isVisible,
  booking,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratingLabels: { [key: number]: string } = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.submitReview(
        booking.id,
        rating,
        comment.trim() || undefined
      );

      if (response.success) {
        Alert.alert('Success', 'Thank you for your review!');
        handleClose();
        onSuccess(rating, comment.trim() || undefined);
      } else {
        Alert.alert('Error', response.message || 'Failed to submit review');
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      const apiMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to submit review';
      Alert.alert('Error', apiMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Rate Your Experience</Text>
              <Text style={styles.subtitle}>
                How was your experience with {booking?.providerProfile?.User?.fullName || 'this provider'}?
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Booking Info */}
            <View style={styles.bookingInfo}>
              <View style={styles.providerCard}>
                <View style={styles.providerIcon}>
                  <Text style={styles.providerIconText}>
                    {booking?.providerProfile?.businessName?.[0] || '?'}
                  </Text>
                </View>
                <View style={styles.providerDetails}>
                  <Text style={styles.providerName}>
                    {booking?.providerProfile?.businessName || 'Unknown Provider'}
                  </Text>
                  <Text style={styles.providerCategory}>
                    {booking?.providerProfile?.category || 'Service'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Rating Section */}
            <View style={styles.ratingSection}>
              <Text style={styles.sectionTitle}>Your Rating</Text>
              
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Star
                      size={40}
                      color="#f59e0b"
                      fill={star <= rating ? '#f59e0b' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {rating > 0 && (
                <View style={styles.ratingLabelContainer}>
                  <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
                </View>
              )}
            </View>

            {/* Comment Section */}
            <View style={styles.commentSection}>
              <Text style={styles.sectionTitle}>Add a Comment (Optional)</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Tell us about your experience..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={6}
                value={comment}
                onChangeText={setComment}
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {comment.length}/500
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting || rating === 0}
              activeOpacity={0.7}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Send size={20} color="#ffffff" />
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  bookingInfo: {
    marginBottom: 24,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  providerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ec4899',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  providerIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  providerCategory: {
    fontSize: 14,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  ratingSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingLabelContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d97706',
  },
  commentSection: {
    marginBottom: 24,
  },
  commentInput: {
    minHeight: 120,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#0f172a',
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#ec4899',
    borderRadius: 16,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default RatingScreen;

