export interface ContextItem {
  type: 'memory' | 'conversation' | 'document' | 'user_input';
  content: string;
  relevance?: number;
  timestamp?: Date;
}

export class ContextAssembler {
  private items: ContextItem[] = [];

  addItem(item: ContextItem): ContextAssembler {
    this.items.push(item);
    return this;
  }

  addMemory(content: string, relevance?: number): ContextAssembler {
    return this.addItem({
      type: 'memory',
      content,
      relevance,
      timestamp: new Date()
    });
  }

  addConversation(content: string): ContextAssembler {
    return this.addItem({
      type: 'conversation',
      content,
      timestamp: new Date()
    });
  }

  addDocument(content: string, relevance?: number): ContextAssembler {
    return this.addItem({
      type: 'document',
      content,
      relevance,
      timestamp: new Date()
    });
  }

  assemble(maxTokens?: number): string {
    // Sort by relevance and timestamp
    const sorted = this.items.sort((a, b) => {
      if (a.relevance && b.relevance) {
        return b.relevance - a.relevance;
      }
      return (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0);
    });

    let context = '';
    let currentTokens = 0;

    for (const item of sorted) {
      const itemContent = `[${item.type.toUpperCase()}] ${item.content}\n\n`;
      const itemTokens = this.estimateTokens(itemContent);
      
      if (maxTokens && currentTokens + itemTokens > maxTokens) {
        break;
      }
      
      context += itemContent;
      currentTokens += itemTokens;
    }

    return context.trim();
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  clear(): ContextAssembler {
    this.items = [];
    return this;
  }
}
