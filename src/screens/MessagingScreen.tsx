import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Send, 
  ArrowLeft, 
  Circle, 
  Image as ImageIcon,
  Paperclip,
  MoreVertical 
} from 'lucide-react-native';
import { messagingService, Conversation, Message, User } from '../services/messagingService';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');

interface MessagingScreenProps {
  onNavigate?: (screen: string) => void;
  userData?: any;
  bookingId?: string;
  recipientId?: string;
}

const MessagingScreen: React.FC<MessagingScreenProps> = ({ 
  onNavigate, 
  userData,
  bookingId,
  recipientId 
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  const flatListRef = useRef<FlatList>(null);

  // Initialize
  useEffect(() => {
    initializeMessaging();
    return () => {
      messagingService.disconnect();
    };
  }, []);

  // Auto-create conversation if bookingId and recipientId are provided
  useEffect(() => {
    if (bookingId && recipientId && conversations.length === 0) {
      createInitialConversation();
    }
  }, [bookingId, recipientId, conversations.length]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      setupSocketListeners();
    }
  }, [selectedConversation]);

  const initializeMessaging = async () => {
    try {
      // Load token from API service to ensure it's up to date
      await apiService.loadToken();
      
      const token = await AsyncStorage.getItem('token');
      const userJson = await AsyncStorage.getItem('user');
      
      if (!token) {
        Alert.alert('Error', 'Please login to continue');
        onNavigate?.('home');
        return;
      }

      if (!userJson) {
        Alert.alert('Error', 'User data not found');
        onNavigate?.('home');
        return;
      }

      const user = JSON.parse(userJson);
      setCurrentUserId(user.id);

      console.log('🔌 Connecting to messaging server with token:', token.substring(0, 20) + '...');

      // Verify token is valid by making a test API call first
      try {
        const verifyResponse = await apiService.verifyToken();
        if (!verifyResponse.success) {
          throw new Error('Token verification failed');
        }
        console.log('✅ Token verified successfully');
      } catch (verifyError) {
        console.error('❌ Token verification failed:', verifyError);
        Alert.alert(
          'Authentication Error', 
          'Your session has expired. Please login again.',
          [
            { text: 'OK', onPress: () => onNavigate?.('home') }
          ]
        );
        return;
      }

      // Connect socket with token
      await messagingService.connect(token);

      // Load conversations
      await loadConversations();

      setLoading(false);
    } catch (error: any) {
      console.error('Initialization error:', error);
      Alert.alert('Connection Error', error?.message || 'Failed to connect to messaging service. Please try again.');
      setLoading(false);
    }
  };

  const createInitialConversation = async () => {
    try {
      setLoading(true);
      const conversation = await messagingService.createConversation(recipientId!, bookingId);
      setSelectedConversation(conversation);
      setConversations([conversation]);
      await loadMessages();
    } catch (error) {
      console.error('Failed to create conversation:', error);
      Alert.alert('Error', 'Failed to create conversation');
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await messagingService.getConversations();
      setConversations(convs);
      
      // Auto-select if there's only one conversation or if coming from booking
      if ((convs.length === 1 || bookingId) && !selectedConversation) {
        setSelectedConversation(convs[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    try {
      const msgs = await messagingService.getMessages(selectedConversation.id);
      setMessages(msgs);
      
      // Join conversation room
      messagingService.joinConversation(selectedConversation.id);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const setupSocketListeners = () => {
    if (!selectedConversation) return;

    // New message
    messagingService.on('message:new', ({ message }: { message: Message }) => {
      if (message.conversationId === selectedConversation?.id) {
        setMessages(prev => [...prev, message]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
        
        // Mark as read
        messagingService.markAsRead(message.id, message.conversationId);
      }
      
      // Update conversation list
      setConversations(prev => prev.map(conv => 
        conv.id === message.conversationId 
          ? { ...conv, lastMessage: message, lastMessageAt: message.createdAt }
          : conv
      ));
    });

    // Typing indicators
    messagingService.on('typing:start', ({ userId }: { userId: string }) => {
      if (userId !== currentUserId) {
        setTypingUsers(prev => new Set(prev).add(userId));
      }
    });

    messagingService.on('typing:stop', ({ userId }: { userId: string }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // User online/offline
    messagingService.on('user:online', ({ userId }: { userId: string }) => {
      setConversations(prev => prev.map(conv => ({
        ...conv,
        participants: conv.participants.map(p => 
          p.id === userId ? { ...p, isOnline: true } : p
        )
      })));
    });

    messagingService.on('user:offline', ({ userId }: { userId: string }) => {
      setConversations(prev => prev.map(conv => ({
        ...conv,
        participants: conv.participants.map(p => 
          p.id === userId ? { ...p, isOnline: false } : p
        )
      })));
    });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    const text = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      await messagingService.sendMessage(selectedConversation.id, text);
      messagingService.stopTyping(selectedConversation.id);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
      setMessageText(text); // Restore text
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setMessageText(text);
    
    if (!selectedConversation) return;

    if (text.length > 0) {
      messagingService.startTyping(selectedConversation.id);
    } else {
      messagingService.stopTyping(selectedConversation.id);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) {
      const minutes = Math.floor(diff / 60000);
      return minutes < 1 ? 'Just now' : `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === currentUserId;
    const showAvatar = !isMe;

    return (
      <View style={[styles.messageContainer, isMe && styles.messageContainerRight]}>
        {showAvatar && (
          <View style={styles.avatarContainer}>
            {item.sender.avatarUrl ? (
              <Image source={{ uri: item.sender.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {item.sender.fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {item.sender.isOnline && <View style={styles.onlineIndicator} />}
          </View>
        )}
        
        <View style={[styles.messageBubble, isMe && styles.messageBubbleRight]}>
          {!isMe && (
            <Text style={styles.senderName}>{item.sender.fullName}</Text>
          )}
          <Text style={[styles.messageText, isMe && styles.messageTextRight]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isMe && styles.messageTimeRight]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading && conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ec4899" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('home')} style={styles.backButton}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        
        {selectedConversation && (
          <View style={styles.headerContent}>
            {selectedConversation.participants[0]?.avatarUrl ? (
              <Image 
                source={{ uri: selectedConversation.participants[0].avatarUrl }} 
                style={styles.headerAvatar} 
              />
            ) : (
              <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {selectedConversation.participants[0]?.fullName.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            {selectedConversation.participants[0]?.isOnline && (
              <Circle size={12} color="#10b981" fill="#10b981" style={styles.headerOnlineIndicator} />
            )}
            <Text style={styles.headerName}>
              {selectedConversation.participants[0]?.fullName || 'User'}
            </Text>
          </View>
        )}
        
        {selectedConversation && (
          <TouchableOpacity style={styles.menuButton}>
            <MoreVertical size={24} color="#0f172a" />
          </TouchableOpacity>
        )}
      </View>

      {/* Messages List */}
      {selectedConversation ? (
        <KeyboardAvoidingView 
          style={styles.messagesContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
            ListFooterComponent={
              typingUsers.size > 0 ? (
                <View style={styles.typingIndicator}>
                  <Text style={styles.typingText}>Typing...</Text>
                </View>
              ) : null
            }
          />

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Paperclip size={24} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachButton}>
              <ImageIcon size={24} color="#64748b" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#94a3b8"
              value={messageText}
              onChangeText={handleTyping}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendButton, messageText.trim() && styles.sendButtonActive]}
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Send size={20} color={messageText.trim() ? "#ffffff" : "#94a3b8"} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No conversation selected</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: 'relative',
  },
  headerOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 6,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  menuButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  messageContainerRight: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#ec4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  messageBubble: {
    maxWidth: width * 0.7,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  messageBubbleRight: {
    backgroundColor: '#ec4899',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#0f172a',
    lineHeight: 20,
  },
  messageTextRight: {
    color: '#ffffff',
  },
  messageTime: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  messageTimeRight: {
    color: '#ffffff',
    opacity: 0.9,
  },
  typingIndicator: {
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#ec4899',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
  },
});

export default MessagingScreen;
