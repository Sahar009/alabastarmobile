import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';

interface BookingConflictModalProps {
  visible: boolean;
  onClose: () => void;
  onProceed: () => void;
}

const BookingConflictModal: React.FC<BookingConflictModalProps> = ({ visible, onClose, onProceed }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Potential Conflict</Text>
          <Text style={styles.message}>This time may conflict with another booking. Do you want to proceed anyway?</Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={[styles.btn, styles.cancel]}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onProceed} style={[styles.btn, styles.proceed]}>
              <Text style={[styles.btnText, { color: '#fff' }]}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'center', alignItems: 'center' },
  card: { width: '86%', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  message: { fontSize: 14, color: '#475569', lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  cancel: { backgroundColor: '#fff' },
  proceed: { backgroundColor: '#ec4899', borderColor: '#ec4899' },
  btnText: { color: '#0f172a', fontSize: 14, fontWeight: '600' },
});

export default BookingConflictModal;







