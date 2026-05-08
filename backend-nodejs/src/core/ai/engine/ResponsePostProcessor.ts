export interface ProcessedResponse {
  content: string;
  metadata: {
    confidence: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    wordCount: number;
    processingTime: number;
  };
}

export class ResponsePostProcessor {
  /**
   * Processes AI response after generation
   * Analyzes and adds metadata
   */
  static process(response: string, startTime: number): ProcessedResponse {
    const processingTime = Date.now() - startTime;
    
    return {
      content: this.cleanResponse(response),
      metadata: {
        confidence: this.calculateConfidence(response),
        sentiment: this.analyzeSentiment(response),
        wordCount: this.countWords(response),
        processingTime
      }
    };
  }

  /**
   * Cleans response from unwanted artifacts
   */
  private static cleanResponse(response: string): string {
    return response
      .trim()
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/\s{2,}/g, ' ') // Remove excessive spaces
      .replace(/^\s+|\s+$/g, ''); // Trim whitespace
  }

  /**
   * Simple confidence calculation based on response characteristics
   */
  private static calculateConfidence(response: string): number {
    let confidence = 0.5; // Base confidence

    // Longer responses get higher confidence
    if (response.length > 100) confidence += 0.2;
    if (response.length > 500) confidence += 0.1;

    // Structured responses get higher confidence
    if (response.includes('\n')) confidence += 0.1;

    // Responses with questions get higher confidence (engagement)
    if (response.includes('?')) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Basic sentiment analysis
   */
  private static analyzeSentiment(response: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'helpful', 'useful', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'difficult', 'problem', 'issue'];
    
    const lowerResponse = response.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (lowerResponse.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (lowerResponse.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  /**
   * Counts words in response
   */
  private static countWords(response: string): number {
    return response.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}
