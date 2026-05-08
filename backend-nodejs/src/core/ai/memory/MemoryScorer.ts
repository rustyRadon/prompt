export interface MemoryScore {
  relevance: number;
  importance: number;
  recency: number;
  frequency: number;
  total: number;
}

export interface ScoringFactors {
  relevanceWeight: number;
  importanceWeight: number;
  recencyWeight: number;
  frequencyWeight: number;
}

export class MemoryScorer {
  private defaultWeights: ScoringFactors = {
    relevanceWeight: 0.4,
    importanceWeight: 0.3,
    recencyWeight: 0.2,
    frequencyWeight: 0.1
  };

  private accessFrequency: Map<string, number> = new Map();

  scoreMemory(
    content: string,
    query: string,
    importance: number,
    timestamp: Date,
    memoryId: string,
    customWeights?: Partial<ScoringFactors>
  ): MemoryScore {
    const weights = { ...this.defaultWeights, ...customWeights };

    const relevance = this.calculateRelevance(content, query);
    const recency = this.calculateRecency(timestamp);
    const frequency = this.getAccessFrequency(memoryId);

    const total = 
      relevance * weights.relevanceWeight +
      importance * weights.importanceWeight +
      recency * weights.recencyWeight +
      frequency * weights.frequencyWeight;

    return {
      relevance,
      importance,
      recency,
      frequency,
      total
    };
  }

  scoreVectorMemory(
    similarity: number,
    importance: number,
    timestamp: Date,
    memoryId: string,
    customWeights?: Partial<ScoringFactors>
  ): MemoryScore {
    const weights = { ...this.defaultWeights, ...customWeights };

    const relevance = similarity; // Vector similarity is already a relevance score
    const recency = this.calculateRecency(timestamp);
    const frequency = this.getAccessFrequency(memoryId);

    const total = 
      relevance * weights.relevanceWeight +
      importance * weights.importanceWeight +
      recency * weights.recencyWeight +
      frequency * weights.frequencyWeight;

    return {
      relevance,
      importance,
      recency,
      frequency,
      total
    };
  }

  updateAccessFrequency(memoryId: string): void {
    const current = this.accessFrequency.get(memoryId) || 0;
    this.accessFrequency.set(memoryId, current + 1);
  }

  resetAccessFrequency(memoryId: string): void {
    this.accessFrequency.set(memoryId, 0);
  }

  private calculateRelevance(content: string, query: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    let matches = 0;
    let totalQueryWords = queryWords.length;
    
    queryWords.forEach(queryWord => {
      if (contentWords.includes(queryWord)) {
        matches++;
      }
    });
    
    // Basic relevance score
    let relevance = totalQueryWords > 0 ? matches / totalQueryWords : 0;
    
    // Boost for exact phrase matches
    if (content.toLowerCase().includes(query.toLowerCase())) {
      relevance = Math.min(relevance + 0.3, 1.0);
    }
    
    // Boost for word proximity (simplified)
    const proximityScore = this.calculateWordProximity(queryWords, contentWords);
    relevance = Math.min(relevance + proximityScore * 0.2, 1.0);
    
    return relevance;
  }

  private calculateWordProximity(queryWords: string[], contentWords: string[]): number {
    if (queryWords.length < 2) return 0;
    
    let minDistance = Infinity;
    
    for (let i = 0; i < queryWords.length - 1; i++) {
      const word1Index = contentWords.indexOf(queryWords[i]);
      const word2Index = contentWords.indexOf(queryWords[i + 1]);
      
      if (word1Index !== -1 && word2Index !== -1) {
        const distance = Math.abs(word1Index - word2Index);
        minDistance = Math.min(minDistance, distance);
      }
    }
    
    // Convert distance to proximity score (closer = higher score)
    return minDistance === Infinity ? 0 : 1 / (1 + minDistance);
  }

  private calculateRecency(timestamp: Date): number {
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    
    // Exponential decay function
    const halfLife = 24 * 7; // 1 week half-life
    const decayFactor = Math.log(0.5) / halfLife;
    
    return Math.exp(decayFactor * hoursSinceCreation);
  }

  private getAccessFrequency(memoryId: string): number {
    const frequency = this.accessFrequency.get(memoryId) || 0;
    
    // Normalize frequency (cap at reasonable maximum)
    const maxFrequency = 100;
    return Math.min(frequency / maxFrequency, 1.0);
  }

  getTopMemories<T extends { id: string }>(
    memories: T[],
    getScore: (memory: T) => MemoryScore,
    limit: number = 10
  ): T[] {
    return memories
      .map(memory => ({ memory, score: getScore(memory) }))
      .sort((a, b) => b.score.total - a.score.total)
      .slice(0, limit)
      .map(item => item.memory);
  }

  filterMemoriesByScore<T>(
    memories: T[],
    getScore: (memory: T) => MemoryScore,
    threshold: number = 0.5
  ): T[] {
    return memories.filter(memory => getScore(memory).total >= threshold);
  }

  getScoringFactors(): ScoringFactors {
    return { ...this.defaultWeights };
  }

  updateScoringFactors(newWeights: Partial<ScoringFactors>): void {
    this.defaultWeights = { ...this.defaultWeights, ...newWeights };
  }
}
