export interface Memory {
  id: string;
  content: string;
  type: 'conversation' | 'preference' | 'fact' | 'experience';
  importance: number;
  timestamp: Date;
  tags: string[];
  userId?: string;
}

export interface MemorySearchResult {
  memory: Memory;
  relevance: number;
}

export class MemoryManager {
  private memories: Map<string, Memory> = new Map();

  async addMemory(memory: Omit<Memory, 'id' | 'timestamp'>): Promise<string> {
    const id = this.generateId();
    const fullMemory: Memory = {
      ...memory,
      id,
      timestamp: new Date()
    };
    
    this.memories.set(id, fullMemory);
    return id;
  }

  async updateMemory(id: string, updates: Partial<Memory>): Promise<boolean> {
    const memory = this.memories.get(id);
    if (!memory) return false;
    
    this.memories.set(id, { ...memory, ...updates });
    return true;
  }

  async deleteMemory(id: string): Promise<boolean> {
    return this.memories.delete(id);
  }

  async getMemory(id: string): Promise<Memory | null> {
    return this.memories.get(id) || null;
  }

  async searchMemories(query: string, userId?: string): Promise<MemorySearchResult[]> {
    const results: MemorySearchResult[] = [];
    
    for (const memory of this.memories.values()) {
      if (userId && memory.userId !== userId) continue;
      
      const relevance = this.calculateRelevance(query, memory);
      if (relevance > 0) {
        results.push({ memory, relevance });
      }
    }
    
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  async getRecentMemories(userId?: string, limit: number = 10): Promise<Memory[]> {
    const memories = Array.from(this.memories.values())
      .filter(memory => !userId || memory.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
    
    return memories;
  }

  async getMemoriesByType(type: Memory['type'], userId?: string): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter(memory => memory.type === type && (!userId || memory.userId === userId));
  }

  async getMemoriesByTag(tag: string, userId?: string): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter(memory => memory.tags.includes(tag) && (!userId || memory.userId === userId));
  }

  private calculateRelevance(query: string, memory: Memory): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = memory.content.toLowerCase().split(/\s+/);
    const tagWords = memory.tags.map(tag => tag.toLowerCase());
    
    let relevance = 0;
    
    // Content matching
    queryWords.forEach(queryWord => {
      if (contentWords.includes(queryWord)) {
        relevance += 1;
      }
    });
    
    // Tag matching
    queryWords.forEach(queryWord => {
      if (tagWords.includes(queryWord)) {
        relevance += 2; // Tags are more important
      }
    });
    
    // Importance boost
    relevance *= memory.importance;
    
    // Recency boost (more recent memories get slight boost)
    const daysSinceCreation = (Date.now() - memory.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7) {
      relevance *= 1.2;
    }
    
    return relevance;
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async clearUserMemories(userId: string): Promise<void> {
    for (const [id, memory] of this.memories.entries()) {
      if (memory.userId === userId) {
        this.memories.delete(id);
      }
    }
  }

  async getMemoryStats(userId?: string): Promise<{
    total: number;
    byType: Record<Memory['type'], number>;
    averageImportance: number;
  }> {
    const memories = Array.from(this.memories.values())
      .filter(memory => !userId || memory.userId === userId);
    
    const byType: Record<Memory['type'], number> = {
      conversation: 0,
      preference: 0,
      fact: 0,
      experience: 0
    };
    
    let totalImportance = 0;
    
    memories.forEach(memory => {
      byType[memory.type]++;
      totalImportance += memory.importance;
    });
    
    return {
      total: memories.length,
      byType,
      averageImportance: memories.length > 0 ? totalImportance / memories.length : 0
    };
  }
}
