export interface PromptSection {
  name: string;
  content: string;
  source: string;
  required: boolean;
}

export interface CompiledPrompt {
  systemPrompt: string;
  sections: PromptSection[];
  metadata: {
    compilationTime: number;
    totalSections: number;
    variablesInjected: string[];
    warnings: string[];
  };
}

export interface PromptCompilationRequest {
  userId: string;
  userType: string;
  mode?: string;
  variables: Record<string, any>;
  context?: {
    currentTask?: string;
    emotionalState?: string;
    conversationHistory?: Array<{
      role: string;
      content: string;
      timestamp: Date;
    }>;
    userGoals?: string[];
  };
}

export interface PromptValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  missingVariables: string[];
}

export interface PersonalityConfig {
  type: string;
  fileName: string;
  description: string;
  expertise: string[];
  defaultMode?: string;
}

export interface ModeConfig {
  name: string;
  fileName: string;
  description: string;
  bestFor: string[];
  incompatibleWith?: string[];
}

export interface PromptOptimization {
  removeDuplicates: boolean;
  optimizeLength: boolean;
  prioritizeSections: string[];
  maxTokens?: number;
}

export interface RuntimeContext {
  currentTime: Date;
  activeTask?: string;
  emotionalState?: 'neutral' | 'happy' | 'sad' | 'frustrated' | 'anxious' | 'excited' | 'confused';
  recentMessages: Array<{
    role: string;
    content: string;
    timestamp: Date;
  }>;
  userMode: string;
  sessionDuration?: number;
}

export interface MemoryInjection {
  longTermMemories: Array<{
    content: string;
    type: string;
    importance: number;
    timestamp: Date;
  }>;
  recentConversations: Array<{
    summary: string;
    timestamp: Date;
  }>;
  goals: Array<{
    description: string;
    status: 'active' | 'completed' | 'paused';
    priority: 'high' | 'medium' | 'low';
  }>;
  unfinishedTasks: Array<{
    description: string;
    dueDate?: Date;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface VariableMapping {
  [key: string]: {
    source: 'static' | 'dynamic' | 'memory' | 'context';
    value: any;
    required: boolean;
  };
}

export enum PromptSectionType {
  BASE = 'base_personality',
  CREATIVE = 'creative_personality', 
  MODE = 'mode',
  MEMORY = 'runtime_memory',
  CONTEXT = 'runtime_context',
  BOUNDARIES = 'safety_boundaries'
}

export enum CompilationPriority {
  CRITICAL = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4
}
