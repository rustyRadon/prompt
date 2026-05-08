import { Personality, PersonalityLoader } from './PersonalityLoader';

export interface PersonalityUsage {
  personalityId: string;
  usageCount: number;
  lastUsed: Date;
  averageRating: number;
  feedback: string[];
}

export interface RegistryStats {
  totalPersonalities: number;
  activePersonalities: number;
  totalUsage: number;
  averageRating: number;
  mostUsedPersonality?: string;
  highestRatedPersonality?: string;
}

export class PersonalityRegistry {
  private loader: PersonalityLoader;
  private usage: Map<string, PersonalityUsage> = new Map();
  private activePersonalities: Set<string> = new Set();

  constructor(loader: PersonalityLoader) {
    this.loader = loader;
  }

  async registerPersonality(personality: Personality): Promise<boolean> {
    try {
      // Validate personality before registration
      const validation = this.loader.validatePersonality(personality);
      if (!validation.valid) {
        console.error('Personality validation failed:', validation.errors);
        return false;
      }

      // Load the personality
      await this.loader.loadPersonalityFromConfig(personality);
      
      // Initialize usage tracking
      this.usage.set(personality.id, {
        personalityId: personality.id,
        usageCount: 0,
        lastUsed: new Date(),
        averageRating: 0,
        feedback: []
      });

      console.log(`Personality "${personality.name}" registered successfully`);
      return true;
    } catch (error) {
      console.error('Failed to register personality:', error);
      return false;
    }
  }

  async loadAndRegisterPersonality(filePath: string): Promise<boolean> {
    const personality = await this.loader.loadPersonalityFromFile(filePath);
    if (!personality) return false;

    return this.registerPersonality(personality);
  }

  getPersonality(id: string): Personality | null {
    return this.loader.getPersonality(id);
  }

  getAllPersonalities(): Personality[] {
    return this.loader.getAllPersonalities();
  }

  getActivePersonalities(): Personality[] {
    return Array.from(this.activePersonalities)
      .map(id => this.loader.getPersonality(id))
      .filter((p): p is Personality => p !== null);
  }

  activatePersonality(id: string): boolean {
    const personality = this.loader.getPersonality(id);
    if (!personality) return false;

    this.activePersonalities.add(id);
    return true;
  }

  deactivatePersonality(id: string): boolean {
    return this.activePersonalities.delete(id);
  }

  isPersonalityActive(id: string): boolean {
    return this.activePersonalities.has(id);
  }

  recordUsage(personalityId: string, rating?: number, feedback?: string): void {
    const usage = this.usage.get(personalityId);
    if (!usage) return;

    usage.usageCount++;
    usage.lastUsed = new Date();

    if (rating !== undefined) {
      const totalRatings = usage.averageRating * (usage.usageCount - 1) + rating;
      usage.averageRating = totalRatings / usage.usageCount;
    }

    if (feedback) {
      usage.feedback.push(feedback);
    }
  }

  getUsageStats(personalityId: string): PersonalityUsage | null {
    return this.usage.get(personalityId) || null;
  }

  getAllUsageStats(): PersonalityUsage[] {
    return Array.from(this.usage.values());
  }

  getRegistryStats(): RegistryStats {
    const personalities = this.loader.getAllPersonalities();
    const usageStats = Array.from(this.usage.values());

    const totalUsage = usageStats.reduce((sum, usage) => sum + usage.usageCount, 0);
    const averageRating = usageStats.length > 0 
      ? usageStats.reduce((sum, usage) => sum + usage.averageRating, 0) / usageStats.length 
      : 0;

    const mostUsed = usageStats.reduce((max, usage) => 
      usage.usageCount > (max?.usageCount || 0) ? usage : max, 
      usageStats[0]
    );

    const highestRated = usageStats.reduce((max, usage) => 
      usage.averageRating > (max?.averageRating || 0) ? usage : max, 
      usageStats[0]
    );

    return {
      totalPersonalities: personalities.length,
      activePersonalities: this.activePersonalities.size,
      totalUsage,
      averageRating,
      mostUsedPersonality: mostUsed?.personalityId,
      highestRatedPersonality: highestRated?.personalityId
    };
  }

  searchPersonalities(query: string): Personality[] {
    return this.loader.searchPersonalities(query);
  }

  getPersonalitiesByTrait(traitName: string, minValue: number = 0.5): Personality[] {
    return this.loader.getPersonalitiesByTrait(traitName, minValue);
  }

  getRecommendedPersonalities(context: {
    userPreferences?: string[];
    recentUsage?: string[];
    taskType?: string;
  }): Personality[] {
    const allPersonalities = this.loader.getAllPersonalities();
    const scores = new Map<string, number>();

    allPersonalities.forEach(personality => {
      let score = 0;

      // Score based on user preferences
      if (context.userPreferences) {
        context.userPreferences.forEach(pref => {
          if (personality.name.toLowerCase().includes(pref.toLowerCase()) ||
              personality.description.toLowerCase().includes(pref.toLowerCase())) {
            score += 2;
          }
        });
      }

      // Score based on recent usage (prefer variety)
      if (context.recentUsage) {
        if (!context.recentUsage.includes(personality.id)) {
          score += 1; // Boost for unused personalities
        }
      }

      // Score based on task type
      if (context.taskType) {
        const taskTraits = this.getTraitsForTask(context.taskType);
        taskTraits.forEach(trait => {
          const personalityTrait = personality.traits.find(t => 
            t.name.toLowerCase() === trait.toLowerCase()
          );
          if (personalityTrait) {
            score += personalityTrait.value * 3;
          }
        });
      }

      // Score based on ratings
      const usage = this.usage.get(personality.id);
      if (usage && usage.averageRating > 0) {
        score += usage.averageRating * 2;
      }

      scores.set(personality.id, score);
    });

    return allPersonalities
      .sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0))
      .slice(0, 5); // Return top 5 recommendations
  }

  private getTraitsForTask(taskType: string): string[] {
    const taskTraits: Record<string, string[]> = {
      'creative': ['creativity', 'openness', 'imagination'],
      'technical': ['analytical', 'precision', 'logic'],
      'support': ['empathy', 'patience', 'friendliness'],
      'teaching': ['patience', 'clarity', 'encouragement'],
      'brainstorming': ['creativity', 'enthusiasm', 'openness'],
      'analysis': ['analytical', 'critical_thinking', 'objectivity']
    };

    return taskTraits[taskType.toLowerCase()] || [];
  }

  async exportRegistry(): Promise<string> {
    const personalities = this.loader.getAllPersonalities();
    const usageStats = Array.from(this.usage.values());
    const registryData = {
      personalities,
      usage: usageStats,
      activePersonalities: Array.from(this.activePersonalities),
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(registryData, null, 2);
  }

  async importRegistry(data: string): Promise<boolean> {
    try {
      const registryData = JSON.parse(data);
      
      // Import personalities
      if (registryData.personalities) {
        for (const personality of registryData.personalities) {
          await this.registerPersonality(personality);
        }
      }

      // Import usage stats
      if (registryData.usage) {
        for (const usage of registryData.usage) {
          this.usage.set(usage.personalityId, usage);
        }
      }

      // Import active personalities
      if (registryData.activePersonalities) {
        this.activePersonalities = new Set(registryData.activePersonalities);
      }

      console.log('Registry imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import registry:', error);
      return false;
    }
  }

  clearRegistry(): void {
    this.usage.clear();
    this.activePersonalities.clear();
  }
}
