import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Linking,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Send, 
  ArrowLeft, 
  Circle, 
  Image as ImageIcon,
  Paperclip,
  MoreVertical,
  PhoneCall,
  MessageSquare,
} from 'lucide-react-native';
import { messagingService, Conversation, Message } from '../services/messagingService';
import { apiService } from '../services/api';
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';

const { width } = Dimensions.get('window');

interface MessagingScreenProps {
  onNavigate?: (screen: string) => void;
  userData?: any; // Reserved for future use
  bookingId?: string;
  recipientId?: string;
}

const MessagingScreen: React.FC<MessagingScreenProps> = ({ 
  onNavigate, 
  userData: _userData,
  bookingId,
  recipientId 
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'customer' | 'provider' | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [sendingAttachment, setSendingAttachment] = useState(false);
  const autoSelectRef = useRef(false);
  const skeletonPulse = useRef(new Animated.Value(0)).current;
  const [messagesLoading, setMessagesLoading] = useState(false);
  const skeletonOpacity = skeletonPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });

  const sortConversations = useCallback((items: Conversation[]) => {
    return [...items].sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }, []);

  const getOtherParticipant = useCallback(
    (conversation: Conversation) => {
      return conversation.participants.find(p => p.id !== currentUserId) || conversation.participants[0];
    },
    [currentUserId]
  );

  const flatListRef = useRef<FlatList>(null);

  // Initialize
  useEffect(() => {
    initializeMessaging();
    return () => {
      messagingService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonPulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [skeletonPulse]);

  // Auto-create conversation if bookingId and recipientId are provided
  useEffect(() => {
    if (bookingId && recipientId && conversations.length === 0) {
      createInitialConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, recipientId, conversations.length]);

  useEffect(() => {
    if (!selectedConversation) {
      loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation]);

  const loadConversations = useCallback(async () => {
    try {
      const convs = await messagingService.getConversations();
      const sorted = sortConversations(convs);
      setConversations(sorted);
      
      if ((bookingId || recipientId) && !selectedConversation && !autoSelectRef.current && sorted.length > 0) {
        autoSelectRef.current = true;
        setSelectedConversation(sorted[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, [bookingId, recipientId, selectedConversation, sortConversations]);

  const appendMessage = useCallback((incoming: Message) => {
    if (!incoming) return;
    setMessages(prev => {
      const index = prev.findIndex(msg => msg.id === incoming.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = incoming;
        return updated;
      }
      return [...prev, incoming];
    });
  }, []);

  const updateConversationWithMessage = useCallback((message: Message) => {
    if (!message) return;
    setConversations(prev => sortConversations(prev.map(conv =>
      conv.id === message.conversationId
        ? { ...conv, lastMessage: message, lastMessageAt: message.createdAt }
        : conv
    )));
  }, [sortConversations]);

  const loadMessages = useCallback(async (conversationId: number) => {
    try {
      setMessagesLoading(true);
      const msgs = await messagingService.getMessages(conversationId);
      setMessages(msgs || []);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const conversationId = selectedConversation.id;
    loadMessages(conversationId);
    messagingService.joinConversation(conversationId);

    const handleMessageNew = ({ message }: { message: Message }) => {
      if (!message) return;
      appendMessage(message);
      updateConversationWithMessage(message);

      if (message.conversationId === conversationId && message.senderId !== currentUserId) {
        messagingService.markAsRead(message.id, message.conversationId);
      }

      if (message.conversationId === conversationId) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 120);
      }
    };

    const handleTypingStart = ({ userId }: { userId: string }) => {
      if (userId && userId !== currentUserId) {
        setTypingUsers(prev => new Set(prev).add(userId));
      }
    };

    const handleTypingStop = ({ userId }: { userId: string }) => {
      if (!userId) return;
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    };

    const handleUserOnline = ({ userId }: { userId: string }) => {
      if (!userId) return;
      setConversations(prev => prev.map(conv => ({
        ...conv,
        participants: conv.participants.map(p =>
          p.id === userId ? { ...p, isOnline: true } : p
        )
      })));
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      if (!userId) return;
      setConversations(prev => prev.map(conv => ({
        ...conv,
        participants: conv.participants.map(p =>
          p.id === userId ? { ...p, isOnline: false } : p
        )
      })));
    };

    messagingService.on('message:new', handleMessageNew);
    messagingService.on('typing:start', handleTypingStart);
    messagingService.on('typing:stop', handleTypingStop);
    messagingService.on('user:online', handleUserOnline);
    messagingService.on('user:offline', handleUserOffline);

    return () => {
      messagingService.leaveConversation(conversationId);
      messagingService.off('message:new', handleMessageNew);
      messagingService.off('typing:start', handleTypingStart);
      messagingService.off('typing:stop', handleTypingStop);
      messagingService.off('user:online', handleUserOnline);
      messagingService.off('user:offline', handleUserOffline);
    };
  }, [selectedConversation, currentUserId, appendMessage, updateConversationWithMessage, loadMessages]);

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
      setCurrentUserRole(user.role || 'customer');

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
      autoSelectRef.current = true;
      setSelectedConversation(conversation);
      setConversations(prev => {
        const filtered = prev.filter(conv => conv.id !== conversation.id);
        return sortConversations([conversation, ...filtered]);
      });
      await loadMessages(conversation.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      Alert.alert('Error', 'Failed to create conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    autoSelectRef.current = true;
    setSelectedConversation(conversation);
  }, []);

  const handleSendMessage = async () => {
    if (!selectedConversation) return;

    const text = messageText.trim();
    if (!text) return;

    setMessageText('');
    setSending(true);

    try {
      const newMessage = await messagingService.sendMessage(selectedConversation.id, text, {
        messageType: 'text',
      });

      if (newMessage) {
        appendMessage(newMessage);
        updateConversationWithMessage(newMessage);
      }

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

  const formatTime = useCallback((dateString: string) => {
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
  }, []);

  const formatFileSize = (size?: number | null) => {
    if (!size || Number.isNaN(size)) {
      return '';
    }
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openExternalLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open attachment.');
    });
  };

  const dialParticipant = (phone?: string) => {
    if (!phone) {
      Alert.alert('Call', 'No phone number available for this user.');
      return;
    }

    let sanitized = phone.replace(/[\s()-]/g, '');
    if (!sanitized.startsWith('+')) {
      sanitized = `+${sanitized}`;
    }

    const telUrl = `tel:${sanitized}`;
    Linking.openURL(telUrl).catch(error => {
      console.error('Dial error:', error);
      Alert.alert('Call Failed', 'Unable to open the dialer at the moment.');
    });
  };

  const openWhatsAppForParticipant = (phone?: string) => {
    if (!phone) {
      Alert.alert('WhatsApp', 'No phone number available for this user.');
      return;
    }

    // Remove all non-digit characters except +
    let sanitized = phone.replace(/[\s()-]/g, '');
    
    // Convert to international format if not already
    if (sanitized.startsWith('0')) {
      // Nigerian number starting with 0, replace with +234
      sanitized = `+234${sanitized.substring(1)}`;
    } else if (sanitized.startsWith('234')) {
      sanitized = `+${sanitized}`;
    } else if (!sanitized.startsWith('+')) {
      sanitized = `+${sanitized}`;
    }

    // Remove + for WhatsApp URL
    const whatsappNumber = sanitized.replace(/^\+/, '');
    const whatsappUrl = `https://wa.me/${whatsappNumber}`;
    
    Linking.openURL(whatsappUrl).catch(error => {
      console.error('WhatsApp error:', error);
      Alert.alert('WhatsApp Failed', 'Unable to open WhatsApp. Please make sure WhatsApp is installed.');
    });
  };

  const handlePickImage = async () => {
    if (!selectedConversation) {
      Alert.alert('No conversation selected', 'Please select a conversation before sending an image.');
      return;
    }

    if (sendingAttachment) return;

    setSendingAttachment(true);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.8,
      });

      if (!result || result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (!asset?.uri) {
        throw new Error('Unable to access selected image');
      }

      const newMessage = await messagingService.sendMessage(selectedConversation.id, '', {
        messageType: 'image',
        file: {
          uri: asset.uri,
          name: asset.fileName || `image-${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        },
        fileSize: asset.fileSize ?? undefined,
      });

      if (newMessage) {
        appendMessage(newMessage);
        updateConversationWithMessage(newMessage);
      }
    } catch (error: any) {
      if (error?.message?.includes('User cancelled')) {
        return;
      }
      console.error('Failed to pick image:', error);
      Alert.alert('Error', error?.message || 'Failed to pick image');
    } finally {
      setSendingAttachment(false);
    }
  };

  const handlePickDocument = async () => {
    if (!selectedConversation) {
      Alert.alert('No conversation selected', 'Please select a conversation before sending a file.');
      return;
    }

    if (sendingAttachment) return;

    setSendingAttachment(true);
    try {
      const document = await DocumentPicker.pickSingle({
        type: DocumentPicker.types.allFiles,
        presentationStyle: 'fullScreen',
      });

      if (!document?.uri) {
        throw new Error('Unable to access selected file');
      }

      const newMessage = await messagingService.sendMessage(selectedConversation.id, '', {
        messageType: document.type?.startsWith('image/') ? 'image' : 'file',
        file: {
          uri: document.uri,
          name: document.name || `file-${Date.now()}`,
          type: document.type || 'application/octet-stream',
        },
        fileSize: document.size ?? undefined,
      });

      if (newMessage) {
        appendMessage(newMessage);
        updateConversationWithMessage(newMessage);
      }
    } catch (error: any) {
      if (DocumentPicker.isCancel?.(error)) {
        return;
      }
      console.error('Failed to pick document:', error);
      Alert.alert('Error', error?.message || 'Failed to pick document');
    } finally {
      setSendingAttachment(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === currentUserId;
    const showAvatar = !isMe;
    const messageType = item.messageType || 'text';
    const content = item.content || '';
    const mediaUrl = item.mediaUrl || undefined;

    return (
      <View style={[styles.messageContainer, isMe && styles.messageContainerRight]}>
        {showAvatar && (
          <View style={styles.avatarContainer}>
            {item.sender?.avatarUrl ? (
              <Image source={{ uri: item.sender.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {item.sender?.fullName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            {item.sender?.isOnline && <View style={styles.onlineIndicator} />}
          </View>
        )}
        
        <View style={[styles.messageBubble, isMe && styles.messageBubbleRight]}>
          {!isMe && item.sender?.fullName && (
            <Text style={styles.senderName}>{item.sender.fullName}</Text>
          )}

          {messageType === 'image' && mediaUrl ? (
            <TouchableOpacity onPress={() => openExternalLink(mediaUrl)} activeOpacity={0.85}>
              <Image source={{ uri: mediaUrl }} style={styles.messageImage} resizeMode="cover" />
            </TouchableOpacity>
          ) : null}

          {messageType === 'file' && mediaUrl ? (
            <TouchableOpacity
              style={styles.fileAttachment}
              onPress={() => openExternalLink(mediaUrl)}
              activeOpacity={0.8}
            >
              <Paperclip size={18} color={isMe ? '#ffffff' : '#0f172a'} />
              <View style={styles.fileDetails}>
                <Text
                  style={[styles.fileNameText, isMe && styles.fileNameTextRight]}
                  numberOfLines={1}
                >
                  {item.fileName || 'Attachment'}
                </Text>
                {item.fileSize ? (
                  <Text style={[styles.fileSizeText, isMe && styles.fileSizeTextRight]}>
                    {formatFileSize(item.fileSize)}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ) : null}

          {content ? (
            <Text style={[styles.messageText, isMe && styles.messageTextRight]}>
              {content}
            </Text>
          ) : null}

          <Text style={[styles.messageTime, isMe && styles.messageTimeRight]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderConversationItem = useCallback(
    ({ item }: { item: Conversation }) => {
      const participant = getOtherParticipant(item);
      const isActive = selectedConversation?.id === item.id;
      const previewMessage = item.lastMessage?.content
        || (item.lastMessage?.messageType === 'image' ? '📷 Photo' : item.lastMessage?.messageType === 'file' ? '📎 Attachment' : 'No messages yet');
      const previewTime = item.lastMessageAt ? formatTime(item.lastMessageAt) : '';

      return (
        <TouchableOpacity
          style={[styles.conversationItem, isActive && styles.conversationItemActive]}
          onPress={() => handleSelectConversation(item)}
          activeOpacity={0.8}
        >
          <View style={styles.conversationAvatarWrapper}>
            {participant?.avatarUrl ? (
              <Image source={{ uri: participant.avatarUrl }} style={styles.conversationAvatar} />
            ) : (
              <View style={[styles.conversationAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {participant?.fullName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            {participant?.isOnline && <View style={styles.conversationOnlineIndicator} />}
          </View>
          <View style={styles.conversationDetails}>
            <View style={styles.conversationHeaderRow}>
              <Text style={styles.conversationName} numberOfLines={1}>
                {participant?.fullName || 'User'}
              </Text>
              {previewTime ? <Text style={styles.conversationTime}>{previewTime}</Text> : null}
            </View>
            <Text style={styles.conversationPreview} numberOfLines={1}>
              {previewMessage}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [formatTime, getOtherParticipant, handleSelectConversation, selectedConversation?.id]
  );

  const renderConversationSkeleton = () => (
    <FlatList
      data={Array.from({ length: 6 })}
      keyExtractor={(_, index) => `skeleton-${index}`}
      renderItem={() => (
        <View style={styles.conversationSkeletonItem}>
          <Animated.View style={[styles.conversationSkeletonAvatar, { opacity: skeletonOpacity }]} />
          <View style={styles.conversationSkeletonContent}>
            <Animated.View style={[styles.conversationSkeletonLine, { opacity: skeletonOpacity }]} />
            <Animated.View style={[styles.conversationSkeletonSubLine, { opacity: skeletonOpacity }]} />
          </View>
        </View>
      )}
      contentContainerStyle={styles.conversationSkeletonList}
    />
  );

  const renderMessageSkeleton = () => (
    <View style={styles.messageSkeletonContainer}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={[styles.messageSkeletonRow, index % 2 === 0 && styles.messageSkeletonRowRight]}>
          <View style={styles.messageSkeletonBubbleWrapper}>
            <Animated.View style={[styles.messageSkeletonBubble, { opacity: skeletonOpacity }]} />
            <Animated.View style={[styles.messageSkeletonMeta, { opacity: skeletonOpacity }]} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (selectedConversation) {
              setSelectedConversation(null);
            } else {
              onNavigate?.('home');
            }
          }}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        
        {selectedConversation ? (
          <View style={styles.headerContent}>
            {(() => {
              const participant = getOtherParticipant(selectedConversation);
              if (participant?.avatarUrl) {
                return (
                  <Image
                    source={{ uri: participant.avatarUrl }}
                    style={styles.headerAvatar}
                  />
                );
              }
              return (
                <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {participant?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              );
            })()}
            {(() => {
              const participant = getOtherParticipant(selectedConversation);
              if (participant?.isOnline) {
                return <Circle size={12} color="#10b981" fill="#10b981" style={styles.headerOnlineIndicator} />;
              }
              return null;
            })()}
            <Text style={styles.headerName}>
              {getOtherParticipant(selectedConversation)?.fullName || 'User'}
            </Text>
          </View>
        ) : (
          <View style={styles.headerContentSingle}>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>
              {currentUserRole === 'provider' 
                ? 'Chat with your customers' 
                : 'Chat with your providers'}
            </Text>
          </View>
        )}
        
        {selectedConversation ? (
          <View style={styles.headerActions}>
            {(() => {
              const participant = getOtherParticipant(selectedConversation);
              const phone = (participant as any)?.phone;
              
              if (!phone) return null;
              
              return (
                <>
                  <TouchableOpacity 
                    style={styles.headerActionButton}
                    onPress={() => dialParticipant(phone)}
                  >
                    <PhoneCall size={18} color="#0f172a" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.headerActionButton}
                    onPress={() => openWhatsAppForParticipant(phone)}
                  >
                    <MessageSquare size={18} color="#25D366" />
                  </TouchableOpacity>
                </>
              );
            })()}
            <TouchableOpacity style={styles.menuButton}>
              <MoreVertical size={24} color="#0f172a" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.menuButtonPlaceholder} />
        )}
      </View>

      {/* Body */}
      {!selectedConversation ? (
        <View style={styles.conversationListContainer}>
          {loading && conversations.length === 0
            ? renderConversationSkeleton()
              : conversations.length === 0
              ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No conversations yet</Text>
                  <Text style={styles.emptyStateHint}>
                    {currentUserRole === 'provider' 
                      ? 'Start a chat from a booking or customer profile.'
                      : 'Start a chat from a provider profile or booking.'}
                  </Text>
                </View>
              )
              : (
                <FlatList
                  data={conversations}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderConversationItem}
                  contentContainerStyle={styles.conversationList}
                />
              )}
        </View>
      ) : (
        <KeyboardAvoidingView 
          style={styles.messagesContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {messagesLoading && messages.length === 0 ? (
            renderMessageSkeleton()
          ) : (
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
          )}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handlePickDocument}
              disabled={sendingAttachment || sending}
            >
              {sendingAttachment ? (
                <ActivityIndicator size="small" color="#64748b" />
              ) : (
                <Paperclip size={24} color="#64748b" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handlePickImage}
              disabled={sendingAttachment || sending}
            >
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
              style={[styles.sendButton, messageText.trim() && !sending && !sendingAttachment && styles.sendButtonActive]}
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sending || sendingAttachment}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Send size={20} color={messageText.trim() ? '#ffffff' : '#94a3b8'} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  headerContentSingle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  menuButton: {
    padding: 4,
  },
  menuButtonPlaceholder: {
    width: 40,
    height: 40,
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
  messageImage: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#cbd5f5',
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  fileDetails: {
    flex: 1,
  },
  fileNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  fileNameTextRight: {
    color: '#ffffff',
  },
  fileSizeText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  fileSizeTextRight: {
    color: '#e2e8f0',
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
  emptyStateHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  conversationListContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  conversationList: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  conversationItemActive: {
    backgroundColor: '#f1f5f9',
    borderColor: '#ec4899',
    borderWidth: 1,
  },
  conversationAvatarWrapper: {
    position: 'relative',
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  conversationOnlineIndicator: {
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
  conversationDetails: {
    flex: 1,
  },
  conversationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 8,
  },
  conversationPreview: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lastMessageText: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  lastMessageTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 8,
  },
  unreadCountBadge: {
    backgroundColor: '#ec4899',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  unreadCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  conversationSkeletonList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  conversationSkeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  conversationSkeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0',
    marginRight: 12,
  },
  conversationSkeletonContent: {
    flex: 1,
  },
  conversationSkeletonLine: {
    height: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  conversationSkeletonSubLine: {
    height: 12,
    width: '60%',
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
  },
  messageSkeletonContainer: {
    padding: 16,
    gap: 16,
  },
  messageSkeletonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messageSkeletonRowRight: {
    justifyContent: 'flex-end',
  },
  messageSkeletonBubbleWrapper: {
    maxWidth: width * 0.7,
    gap: 8,
  },
  messageSkeletonBubble: {
    height: 60,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
  },
  messageSkeletonMeta: {
    width: 60,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
});

export default MessagingScreen;
