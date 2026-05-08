export interface VectorMemoryItem {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    type: string;
    timestamp: Date;
    importance: number;
    userId?: string;
    tags: string[];
  };
}

export interface VectorSearchResult {
  item: VectorMemoryItem;
  similarity: number;
}

export class VectorMemory {
  private memories: Map<string, VectorMemoryItem> = new Map();
  private embeddingDimension: number = 384; // Common dimension for sentence transformers

  async addMemory(
    content: string,
    metadata: VectorMemoryItem['metadata'],
    embedding?: number[]
  ): Promise<string> {
    const id = this.generateId();
    const memoryEmbedding = embedding || await this.generateEmbedding(content);
    
    const item: VectorMemoryItem = {
      id,
      content,
      embedding: memoryEmbedding,
      metadata
    };
    
    this.memories.set(id, item);
    return id;
  }

  async searchMemories(
    query: string,
    userId?: string,
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<VectorSearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const results: VectorSearchResult[] = [];
    
    for (const item of this.memories.values()) {
      if (userId && item.metadata.userId !== userId) continue;
      
      const similarity = this.calculateCosineSimilarity(queryEmbedding, item.embedding);
      
      if (similarity >= threshold) {
        results.push({ item, similarity });
      }
    }
    
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  async getMemory(id: string): Promise<VectorMemoryItem | null> {
    return this.memories.get(id) || null;
  }

  async updateMemory(id: string, content?: string, metadata?: Partial<VectorMemoryItem['metadata']>): Promise<boolean> {
    const item = this.memories.get(id);
    if (!item) return false;
    
    const updatedItem: VectorMemoryItem = {
      ...item,
      content: content || item.content,
      metadata: { ...item.metadata, ...metadata }
    };
    
    if (content) {
      updatedItem.embedding = await this.generateEmbedding(content);
    }
    
    this.memories.set(id, updatedItem);
    return true;
  }

  async deleteMemory(id: string): Promise<boolean> {
    return this.memories.delete(id);
  }

  async getMemoriesByType(type: string, userId?: string): Promise<VectorMemoryItem[]> {
    return Array.from(this.memories.values())
      .filter(item => item.metadata.type === type && (!userId || item.metadata.userId === userId));
  }

  async getMemoriesByTag(tag: string, userId?: string): Promise<VectorMemoryItem[]> {
    return Array.from(this.memories.values())
      .filter(item => item.metadata.tags.includes(tag) && (!userId || item.metadata.userId === userId));
  }

  async getRecentMemories(userId?: string, limit: number = 10): Promise<VectorMemoryItem[]> {
    return Array.from(this.memories.values())
      .filter(item => !userId || item.metadata.userId === userId)
      .sort((a, b) => b.metadata.timestamp.getTime() - a.metadata.timestamp.getTime())
      .slice(0, limit);
  }

  async clearUserMemories(userId: string): Promise<void> {
    for (const [id, item] of this.memories.entries()) {
      if (item.metadata.userId === userId) {
        this.memories.delete(id);
      }
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // In a real implementation, this would use a proper embedding model
    // For now, we'll create a simple hash-based embedding
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(this.embeddingDimension).fill(0);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      const position = hash % this.embeddingDimension;
      embedding[position] += 1 / (index + 1); // Weight by position
    });
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (normA * normB);
  }

  private generateId(): string {
    return `vec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getMemoryStats(userId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    averageImportance: number;
  }> {
    const memories = Array.from(this.memories.values())
      .filter(item => !userId || item.metadata.userId === userId);
    
    const byType: Record<string, number> = {};
    let totalImportance = 0;
    
    memories.forEach(item => {
      byType[item.metadata.type] = (byType[item.metadata.type] || 0) + 1;
      totalImportance += item.metadata.importance;
    });
    
    return {
      total: memories.length,
      byType,
      averageImportance: memories.length > 0 ? totalImportance / memories.length : 0
    };
  }
}
