import { User, Conversation, Message } from '../types';

export interface DatabaseConfig {
  url: string;
  ssl?: boolean;
  maxConnections?: number;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export class Database {
  private static instance: Database;
  private config: DatabaseConfig;
  private connected: boolean = false;

  // In-memory storage for demo purposes
  private users: Map<string, User> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message> = new Map();

  private constructor(config: DatabaseConfig) {
    this.config = config;
  }

  static getInstance(config?: DatabaseConfig): Database {
    if (!Database.instance) {
      if (!config) {
        throw new Error('Database config is required for first initialization');
      }
      Database.instance = new Database(config);
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
    try {
      // In a real implementation, this would connect to an actual database
      // For now, we'll simulate a connection
      console.log('Connecting to database...');
      await this.delay(1000); // Simulate connection time
      this.connected = true;
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      console.log('Disconnecting from database...');
      await this.delay(500); // Simulate disconnection time
      this.connected = false;
      console.log('Database disconnected');
    } catch (error) {
      console.error('Failed to disconnect from database:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // User operations
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    const newUser: User = {
      id: this.generateId('user'),
      ...user,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<Pick<User, 'name'>>): Promise<User | null> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    const user = this.users.get(id);
    if (!user) {
      return null;
    }

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    return this.users.delete(id);
  }

  // Conversation operations
  async createConversation(conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Conversation> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    const newConversation: Conversation = {
      id: this.generateId('conv'),
      ...conversation,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.conversations.set(newConversation.id, newConversation);
    return newConversation;
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    return this.conversations.get(id) || null;
  }

  async getConversationsByUserId(userId: string, options?: QueryOptions): Promise<Conversation[]> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    const conversations = Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId);

    return this.applyQueryOptions(conversations, options);
  }

  async updateConversation(id: string, updates: Partial<Pick<Conversation, 'messages'>>): Promise<Conversation | null> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    const conversation = this.conversations.get(id);
    if (!conversation) {
      return null;
    }

    const updatedConversation = {
      ...conversation,
      ...updates,
      updatedAt: new Date()
    };

    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async deleteConversation(id: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    return this.conversations.delete(id);
  }

  // Message operations
  async createMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    const newMessage: Message = {
      id: this.generateId('msg'),
      ...message,
      timestamp: new Date()
    };

    this.messages.set(newMessage.id, newMessage);
    return newMessage;
  }

  async getMessageById(id: string): Promise<Message | null> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    return this.messages.get(id) || null;
  }

  async getMessagesByConversationId(conversationId: string, options?: QueryOptions): Promise<Message[]> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    const messages = Array.from(this.messages.values())
      .filter(msg => msg.id === conversationId || this.isMessageInConversation(msg, conversationId));

    return this.applyQueryOptions(messages, options);
  }

  async deleteMessage(id: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    return this.messages.delete(id);
  }

  // Utility methods
  private applyQueryOptions<T>(items: T[], options?: QueryOptions): T[] {
    if (!options) return items;

    let result = [...items];

    // Sort
    if (options.orderBy) {
      result.sort((a, b) => {
        const aValue = (a as any)[options.orderBy!];
        const bValue = (b as any)[options.orderBy!];
        
        if (aValue < bValue) return options.orderDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return options.orderDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Pagination
    if (options.offset) {
      result = result.slice(options.offset);
    }

    if (options.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  private isMessageInConversation(message: Message, conversationId: string): boolean {
    // This is a simplified check - in a real database, you'd have proper foreign keys
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;

    return conversation.messages.some(msg => msg.id === message.id);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    return {
      status: this.connected ? 'healthy' : 'unhealthy',
      timestamp: new Date()
    };
  }

  // Get database statistics
  async getStats(): Promise<{
    users: number;
    conversations: number;
    messages: number;
    connected: boolean;
  }> {
    return {
      users: this.users.size,
      conversations: this.conversations.size,
      messages: this.messages.size,
      connected: this.connected
    };
  }
}
