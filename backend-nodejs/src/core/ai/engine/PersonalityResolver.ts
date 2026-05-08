import { PromptLoader } from './PromptLoader';

export interface UserProfile {
  type: string;
  preferences?: string[];
  history?: string[];
}

export class PersonalityResolver {
  /**
   * Resolves creative personality based on user type
   * STRICT: only loads XML, no processing
   */
  static resolvePersonality(userType: string): string {
    const personalityMap: Record<string, string> = {
      'writer': 'writer.xml',
      'musician': 'musician.xml',
      'filmmaker': 'filmmaker.xml',
      'director': 'director.xml',
      'creative': 'writer.xml', // default for creative types
      'analyst': 'writer.xml', // use writer for analytical work
      'default': 'writer.xml'
    };

    const fileName = personalityMap[userType.toLowerCase()] || personalityMap.default;
    
    try {
      return PromptLoader.loadPrompt(`creatives/${fileName}`);
    } catch (error) {
      console.warn(`Failed to load personality ${fileName}, falling back to writer.xml`);
      return PromptLoader.loadPrompt('creatives/writer.xml');
    }
  }

  /**
   * Gets available personality types
   */
  static getAvailablePersonalities(): string[] {
    return [
      'writer',
      'musician', 
      'filmmaker',
      'director',
      'creative',
      'analyst'
    ];
  }

  /**
   * Validates personality type
   */
  static isValidPersonality(type: string): boolean {
    return this.getAvailablePersonalities().includes(type.toLowerCase());
  }
}
