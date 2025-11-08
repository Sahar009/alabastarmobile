import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = 'https://alabastar-backend.onrender.com/api';
const SOCKET_URL = 'https://alabastar-backend.onrender.com/api';

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
  content: string;
  senderId: string;
  sender: User;
  conversationId: number;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'system';
  mediaUrl?: string;
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

    this.socket = io(SOCKET_URL, {
      auth: { 
        token: token.trim() // Ensure token is trimmed
      },
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
      `${API_BASE_URL}/messages/conversations/${conversationId}?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch messages');
    const data = await response.json();
    return data.data?.messages || [];
  }

  async sendMessage(conversationId: number, content: string, type: string = 'text', mediaUrl?: string): Promise<Message> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, type, mediaUrl }),
    });

    if (!response.ok) throw new Error('Failed to send message');
    const data = await response.json();
    return data.data?.message;
  }

  async createConversation(participantId: string, bookingId?: string): Promise<Conversation> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ participantId, bookingId }),
    });

    if (!response.ok) throw new Error('Failed to create conversation');
    const data = await response.json();
    return data.data?.conversation;
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


