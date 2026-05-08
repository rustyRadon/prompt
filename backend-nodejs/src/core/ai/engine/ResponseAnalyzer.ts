export interface AnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  entities: { name: string; type: string }[];
  confidence: number;
  suggestions?: string[];
}

export class ResponseAnalyzer {
  analyzeResponse(response: string): AnalysisResult {
    // Basic sentiment analysis
    const sentiment = this.analyzeSentiment(response);
    
    // Extract topics (simplified)
    const topics = this.extractTopics(response);
    
    // Extract entities (simplified)
    const entities = this.extractEntities(response);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(response);
    
    return {
      sentiment,
      topics,
      entities,
      confidence,
      suggestions: this.generateSuggestions(response, sentiment)
    };
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'poor'];
    
    const lowerText = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  private extractTopics(text: string): string[] {
    // Simple keyword extraction - in real implementation, use NLP library
    const words = text.toLowerCase().split(/\s+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they']);
    
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3 && !commonWords.has(cleanWord)) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      }
    });
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private extractEntities(text: string): { name: string; type: string }[] {
    // Simple entity extraction - in real implementation, use NER
    const entities: { name: string; type: string }[] = [];
    
    // Extract emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex) || [];
    emails.forEach(email => entities.push({ name: email, type: 'email' }));
    
    // Extract URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    urls.forEach(url => entities.push({ name: url, type: 'url' }));
    
    return entities;
  }

  private calculateConfidence(text: string): number {
    // Simple confidence calculation based on text length and structure
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentenceCount;
    
    let confidence = 0.5; // Base confidence
    
    // Longer responses generally have higher confidence
    if (wordCount > 50) confidence += 0.2;
    if (wordCount > 100) confidence += 0.1;
    
    // Well-structured responses
    if (avgWordsPerSentence > 10 && avgWordsPerSentence < 25) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private generateSuggestions(response: string, sentiment: 'positive' | 'negative' | 'neutral'): string[] {
    const suggestions: string[] = [];
    
    if (sentiment === 'negative') {
      suggestions.push('Consider rephrasing for a more positive tone');
      suggestions.push('Add constructive feedback');
    }
    
    if (response.length < 20) {
      suggestions.push('Provide more detailed response');
    }
    
    if (response.split(/\s+/).length < 10) {
      suggestions.push('Consider elaborating on your points');
    }
    
    return suggestions;
  }
}
