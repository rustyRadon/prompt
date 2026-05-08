// Common types used across the application

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  pagination?: PaginationParams;
}

// AI-specific types
export interface AIRequest {
  prompt: string;
  context?: string;
  personality?: string;
  mode?: string;
  userId?: string;
}

export interface AIResponse {
  response: string;
  confidence: number;
  metadata: {
    model: string;
    tokensUsed: number;
    processingTime: number;
    personality?: string;
    mode?: string;
  };
}

export interface Conversation {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Configuration types
export interface DatabaseConfig {
  url: string;
  ssl?: boolean;
  maxConnections?: number;
}

export interface AIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface AppConfig {
  database: DatabaseConfig;
  ai: AIConfig;
  server: {
    port: number;
    host: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
  };
}
