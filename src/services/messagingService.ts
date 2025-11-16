import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = 'https://alabastar-backend.onrender.com/api';
const SOCKET_URL = 'https://alabastar-backend.onrender.com';

// Types
export interface Conversation {
  id: number;
  type: 'direct' | 'group';
  name?: string;
  lastMessage?: Message;
  lastMessageAt: string;
  unreadCount: number;
  participants: User[];
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: string;
  sender: User;
  content: string | null;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'system';
  mediaUrl?: string | null;
  mediaType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  metadata?: Record<string, any> | null;
  replyToId?: number | null;
  createdAt: string;
  updatedAt?: string;
  readBy?: string[];
  isRead?: boolean;
}

export interface User {
  id: string;
  fullName: string;
  avatarUrl?: string;
  profilePicture?: string;
  isOnline?: boolean;
}

class MessagingService {
  private socket: Socket | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  // Socket connection
  async connect(token: string): Promise<void> {
    // Disconnect existing connection if any
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (!token || token.trim() === '') {
      throw new Error('Token is required for socket connection');
    }

    console.log('🔌 Initializing socket connection...');

    const sanitizedToken = token.replace(/^Bearer\s+/i, '').trim();

    this.socket = io(SOCKET_URL, {
      auth: { 
        token: sanitizedToken
      },
      query: {
        token: sanitizedToken
      },
      extraHeaders: {
        Authorization: `Bearer ${sanitizedToken}`
      },
      withCredentials: true,
      transports: ['websocket', 'polling'], // Allow fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: true, // Force new connection
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to messaging server');
      console.log('Socket ID:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from messaging server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      console.error('Error message:', error.message);
      // Don't throw here, let the caller handle it
    });

    // Wait for connection or error
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.socket!.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket!.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Event listeners
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // API methods
  async getConversations(page = 1, limit = 20): Promise<Conversation[]> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`${API_BASE_URL}/messages/conversations?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch conversations');
    const data = await response.json();
    return data.data?.conversations || [];
  }

  async getMessages(conversationId: number, page = 1, limit = 50): Promise<Message[]> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await fetch(
      `${API_BASE_URL}/messages/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch messages');
    const data = await response.json();
    return data.data?.messages || data.data?.items || [];
  }

  async sendMessage(
    conversationId: number,
    content: string,
    options?: {
      messageType?: Message['messageType'];
      file?: {
        uri: string;
        name: string;
        type: string;
      };
      fileSize?: number;
      mediaUrl?: string;
    }
  ): Promise<Message> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const url = `${API_BASE_URL}/messages/conversations/${conversationId}/messages`;
    const defaultMessageType = options?.messageType || (options?.file ? 'file' : 'text');

    let response: Response;

    if (options?.file) {
      const formData = new FormData();
      if (content) {
        formData.append('content', content);
      }
      formData.append('messageType', defaultMessageType);
      if (options.mediaUrl) {
        formData.append('mediaUrl', options.mediaUrl);
      }
      if (options.fileSize !== undefined && options.fileSize !== null) {
        formData.append('fileSize', String(options.fileSize));
      }
      formData.append('file', {
        uri: options.file.uri,
        name: options.file.name,
        type: options.file.type,
      } as any);

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
    } else {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          messageType: defaultMessageType,
          mediaUrl: options?.mediaUrl,
        }),
      });
    }

    if (!response.ok) throw new Error('Failed to send message');
    const data = await response.json();
    return data.data?.message || data.data;
  }

  async createConversation(participantId: string, bookingId?: string): Promise<Conversation> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`${API_BASE_URL}/messages/conversations/direct`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipientId: participantId, bookingId }),
    });

    if (!response.ok) throw new Error('Failed to create conversation');
    const data = await response.json();
    const conversation = data.data?.conversation || data.data;
    if (!conversation) {
      throw new Error(data.message || 'Failed to create conversation');
    }
    return conversation;
  }

  // Socket methods
  joinConversation(conversationId: number): void {
    this.emit('conversation:join', conversationId);
  }

  leaveConversation(conversationId: number): void {
    this.emit('conversation:leave', conversationId);
  }

  startTyping(conversationId: number): void {
    this.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId: number): void {
    this.emit('typing:stop', { conversationId });
  }

  markAsRead(messageId: number, conversationId: number): void {
    this.emit('message:read', { messageId, conversationId });
  }
}

export const messagingService = new MessagingService();


