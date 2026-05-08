import { readFileSync } from 'fs';
import { join } from 'path';

describe('Prompt Template Tests', () => {
  const promptsDir = join(__dirname, '../../src/core/ai/prompts');

  describe('Core Prompts', () => {
    test('base-companion.xml should be valid XML', () => {
      const content = readFileSync(join(promptsDir, 'core/base-companion.xml'), 'utf8');
      expect(() => new DOMParser().parseFromString(content, 'text/xml')).not.toThrow();
    });

    test('questioning-engine.xml should be valid XML', () => {
      const content = readFileSync(join(promptsDir, 'core/questioning-engine.xml'), 'utf8');
      expect(() => new DOMParser().parseFromString(content, 'text/xml')).not.toThrow();
    });

    test('emotional-rules.xml should be valid XML', () => {
      const content = readFileSync(join(promptsDir, 'core/emotional-rules.xml'), 'utf8');
      expect(() => new DOMParser().parseFromString(content, 'text/xml')).not.toThrow();
    });
  });

  describe('Creative Prompts', () => {
    test('writer.xml should be valid XML', () => {
      const content = readFileSync(join(promptsDir, 'creatives/writer.xml'), 'utf8');
      expect(() => new DOMParser().parseFromString(content, 'text/xml')).not.toThrow();
    });

    test('musician.xml should be valid XML', () => {
      const content = readFileSync(join(promptsDir, 'creatives/musician.xml'), 'utf8');
      expect(() => new DOMParser().parseFromString(content, 'text/xml')).not.toThrow();
    });

    test('filmmaker.xml should be valid XML', () => {
      const content = readFileSync(join(promptsDir, 'creatives/filmmaker.xml'), 'utf8');
      expect(() => new DOMParser().parseFromString(content, 'text/xml')).not.toThrow();
    });

    test('creative-director.xml should be valid XML', () => {
      const content = readFileSync(join(promptsDir, 'creatives/creative-director.xml'), 'utf8');
      expect(() => new DOMParser().parseFromString(content, 'text/xml')).not.toThrow();
    });
  });

  describe('Mode Prompts', () => {
    test('brainstorm.xml should be valid XML', () => {
      const content = readFileSync(join(promptsDir, 'modes/brainstorm.xml'), 'utf8');
      expect(() => new DOMParser().parseFromString(content, 'text/xml')).not.toThrow();
    });

    test('critique.xml should be valid XML', () => {
      const content = readFileSync(join(promptsDir, 'modes/critique.xml'), 'utf8');
      expect(() => new DOMParser().parseFromString(content, 'text/xml')).not.toThrow();
    });

    test('motivation.xml should be valid XML', () => {
      const content = readFileSync(join(promptsDir, 'modes/motivation.xml'), 'utf8');
      expect(() => new DOMParser().parseFromString(content, 'text/xml')).not.toThrow();
    });

    test('deep-focus.xml should be valid XML', () => {
      const content = readFileSync(join(promptsDir, 'modes/deep-focus.xml'), 'utf8');
      expect(() => new DOMParser().parseFromString(content, 'text/xml')).not.toThrow();
    });
  });

  describe('Safety Prompts', () => {
    test('boundaries.xml should be valid XML', () => {
      const content = readFileSync(join(promptsDir, 'safety/boundaries.xml'), 'utf8');
      expect(() => new DOMParser().parseFromString(content, 'text/xml')).not.toThrow();
    });
  });

  describe('Prompt Content Validation', () => {
    test('all prompts should have required structure', () => {
      const promptFiles = [
        'core/base-companion.xml',
        'core/questioning-engine.xml',
        'core/emotional-rules.xml',
        'creatives/writer.xml',
        'creatives/musician.xml',
        'creatives/filmmaker.xml',
        'creatives/creative-director.xml',
        'modes/brainstorm.xml',
        'modes/critique.xml',
        'modes/motivation.xml',
        'modes/deep-focus.xml',
        'safety/boundaries.xml'
      ];

      promptFiles.forEach(file => {
        const content = readFileSync(join(promptsDir, file), 'utf8');
        const parsed = new DOMParser().parseFromString(content, 'text/xml');
        
        expect(parsed.querySelector('prompt')).toBeTruthy();
        expect(parsed.querySelector('role')).toBeTruthy();
      });
    });

    test('prompts should contain variable placeholders', () => {
      const content = readFileSync(join(promptsDir, 'core/base-companion.xml'), 'utf8');
      expect(content).toContain('{{user_input}}');
      expect(content).toContain('{{conversation_history}}');
      expect(content).toContain('{{user_preferences}}');
    });
  });
});
