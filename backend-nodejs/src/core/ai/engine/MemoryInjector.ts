import { MemoryManager } from '../memory/MemoryManager';
import { VectorMemory } from '../memory/VectorMemory';

export interface MemoryContext {
  userId: string;
  conversationId?: string;
  limit?: number;
}

export class MemoryInjector {
  private memoryManager: MemoryManager;
  private vectorMemory: VectorMemory;

  constructor() {
    this.memoryManager = new MemoryManager();
    this.vectorMemory = new VectorMemory();
  }

  /**
   * Injects memories into XML format
   * Returns formatted memory block for prompt injection
   */
  async inject(context: MemoryContext): Promise<string> {
    const memories = await this.gatherMemories(context);
    
    return this.formatMemories(memories);
  }

  private async gatherMemories(context: MemoryContext): Promise<any[]> {
    const limit = context.limit || 5;
    const memories = [];

    // Get recent long-term memories
    const recentMemories = await this.memoryManager.getRecentMemories(context.userId, limit);
    memories.push(...recentMemories);

    // Get relevant vector memories based on recent context
    if (context.conversationId) {
      const vectorMemories = await this.vectorMemory.getRecentMemories(context.userId, limit);
      memories.push(...vectorMemories);
    }

    return memories;
  }

  private formatMemories(memories: any[]): string {
    if (memories.length === 0) {
      return '<memory>\n<!-- No relevant memories found -->\n</memory>';
    }

    const memoryItems = memories.map(memory => {
      if (memory.content) {
        return `<item>${this.escapeXml(memory.content)}</item>`;
      }
      return '';
    }).filter(Boolean);

    return `<memory>\n${memoryItems.join('\n')}\n</memory>`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
