export interface Personality {
  id: string;
  name: string;
  description: string;
  traits: PersonalityTrait[];
  prompts: string[];
  behaviors: PersonalityBehavior[];
  settings: PersonalitySettings;
}

export interface PersonalityTrait {
  name: string;
  value: number; // 0-1 scale
  description: string;
}

export interface PersonalityBehavior {
  trigger: string;
  response: string;
  frequency: 'high' | 'medium' | 'low';
}

export interface PersonalitySettings {
  formality: 'casual' | 'professional' | 'formal';
  verbosity: 'concise' | 'balanced' | 'detailed';
  empathy: 'low' | 'medium' | 'high';
  humor: 'none' | 'light' | 'playful';
  creativity: 'low' | 'medium' | 'high';
}

export class PersonalityLoader {
  private personalities: Map<string, Personality> = new Map();
  private loadedFiles: Set<string> = new Set();

  async loadPersonalityFromFile(filePath: string): Promise<Personality | null> {
    try {
      // In a real implementation, this would read from file system
      // For now, we'll return a mock personality
      const personality = this.createMockPersonality(filePath);
      this.personalities.set(personality.id, personality);
      this.loadedFiles.add(filePath);
      return personality;
    } catch (error) {
      console.error(`Failed to load personality from ${filePath}:`, error);
      return null;
    }
  }

  async loadPersonalityFromConfig(config: Partial<Personality>): Promise<Personality> {
    const personality: Personality = {
      id: config.id || this.generateId(),
      name: config.name || 'Unnamed Personality',
      description: config.description || 'No description provided',
      traits: config.traits || [],
      prompts: config.prompts || [],
      behaviors: config.behaviors || [],
      settings: config.settings || this.getDefaultSettings()
    };

    this.personalities.set(personality.id, personality);
    return personality;
  }

  getPersonality(id: string): Personality | null {
    return this.personalities.get(id) || null;
  }

  getAllPersonalities(): Personality[] {
    return Array.from(this.personalities.values());
  }

  async savePersonalityToFile(personality: Personality, filePath: string): Promise<boolean> {
    try {
      // In a real implementation, this would write to file system
      console.log(`Saving personality ${personality.id} to ${filePath}`);
      return true;
    } catch (error) {
      console.error(`Failed to save personality to ${filePath}:`, error);
      return false;
    }
  }

  deletePersonality(id: string): boolean {
    return this.personalities.delete(id);
  }

  updatePersonality(id: string, updates: Partial<Personality>): boolean {
    const personality = this.personalities.get(id);
    if (!personality) return false;

    const updatedPersonality = { ...personality, ...updates };
    this.personalities.set(id, updatedPersonality);
    return true;
  }

  searchPersonalities(query: string): Personality[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.personalities.values()).filter(personality =>
      personality.name.toLowerCase().includes(lowerQuery) ||
      personality.description.toLowerCase().includes(lowerQuery) ||
      personality.traits.some(trait => 
        trait.name.toLowerCase().includes(lowerQuery) ||
        trait.description.toLowerCase().includes(lowerQuery)
      )
    );
  }

  getPersonalitiesByTrait(traitName: string, minValue: number = 0.5): Personality[] {
    return Array.from(this.personalities.values()).filter(personality =>
      personality.traits.some(trait => 
        trait.name.toLowerCase() === traitName.toLowerCase() && 
        trait.value >= minValue
      )
    );
  }

  private createMockPersonality(filePath: string): Personality {
    const name = filePath.split('/').pop()?.replace(/\.(json|yaml|yml)$/, '') || 'Mock Personality';
    
    return {
      id: this.generateId(),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      description: `A personality loaded from ${filePath}`,
      traits: [
        { name: 'friendliness', value: 0.8, description: 'How friendly and approachable the personality is' },
        { name: 'professionalism', value: 0.6, description: 'Level of professional demeanor' },
        { name: 'creativity', value: 0.7, description: 'Creative and innovative thinking' }
      ],
      prompts: [
        'You are a helpful AI assistant with a friendly personality.',
        'Always be supportive and encouraging in your responses.'
      ],
      behaviors: [
        { trigger: 'greeting', response: 'Hello! How can I help you today?', frequency: 'high' },
        { trigger: 'frustration', response: 'I understand this might be frustrating. Let me help you work through it.', frequency: 'medium' }
      ],
      settings: this.getDefaultSettings()
    };
  }

  private getDefaultSettings(): PersonalitySettings {
    return {
      formality: 'professional',
      verbosity: 'balanced',
      empathy: 'medium',
      humor: 'light',
      creativity: 'medium'
    };
  }

  private generateId(): string {
    return `pers_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validatePersonality(personality: Partial<Personality>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!personality.id || personality.id.trim() === '') {
      errors.push('Personality ID is required');
    }

    if (!personality.name || personality.name.trim() === '') {
      errors.push('Personality name is required');
    }

    if (personality.traits) {
      personality.traits.forEach((trait, index) => {
        if (!trait.name || trait.name.trim() === '') {
          errors.push(`Trait ${index + 1} is missing a name`);
        }
        if (typeof trait.value !== 'number' || trait.value < 0 || trait.value > 1) {
          errors.push(`Trait ${index + 1} value must be between 0 and 1`);
        }
      });
    }

    if (personality.settings) {
      const validFormalities: PersonalitySettings['formality'][] = ['casual', 'professional', 'formal'];
      if (!validFormalities.includes(personality.settings.formality)) {
        errors.push('Invalid formality setting');
      }

      const validVerbosity: PersonalitySettings['verbosity'][] = ['concise', 'balanced', 'detailed'];
      if (!validVerbosity.includes(personality.settings.verbosity)) {
        errors.push('Invalid verbosity setting');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
