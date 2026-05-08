import { PromptBuilder } from './PromptBuilder';
import { MemoryInjector } from './MemoryInjector';
import { ContextAssembler } from './ContextAssembler';
import { PersonalityResolver } from './PersonalityResolver';
import { VariableInjector } from './VariableInjector';
import { PromptLoader } from './PromptLoader';
import { 
  PromptCompilationRequest, 
  CompiledPrompt, 
  PromptValidationResult,
  PromptSectionType,
  CompilationPriority 
} from '../types/PromptTypes';

export class PromptCompiler {
  /**
   * MAIN BRAIN - Compiles all prompt components into final system prompt
   * Flow: Base → Creative → Mode → Memory → Context → Boundaries
   */
  static async compile(request: PromptCompilationRequest): Promise<CompiledPrompt> {
    const startTime = Date.now();
    const sections = [];
    const warnings: string[] = [];
    const variablesInjected: string[] = [];

    try {
      // Step 1: Load Base Personality (REQUIRED)
      const basePrompt = PromptLoader.loadPrompt('core/base.xml');
      sections.push({
        name: PromptSectionType.BASE,
        content: basePrompt,
        source: 'core/base.xml',
        required: true
      });

      // Step 2: Load Creative Personality (OPTIONAL)
      if (request.userType && request.userType !== 'default') {
        try {
          const creativePrompt = PersonalityResolver.resolvePersonality(request.userType);
          sections.push({
            name: PromptSectionType.CREATIVE,
            content: creativePrompt,
            source: `creatives/${request.userType}.xml`,
            required: false
          });
        } catch (error) {
          warnings.push(`Failed to load creative personality: ${request.userType}`);
        }
      }

      // Step 3: Load Mode (OPTIONAL)
      if (request.mode && request.mode !== 'default') {
        try {
          const modePrompt = PromptLoader.loadPrompt(`modes/${request.mode}.xml`);
          sections.push({
            name: PromptSectionType.MODE,
            content: modePrompt,
            source: `modes/${request.mode}.xml`,
            required: false
          });
        } catch (error) {
          warnings.push(`Failed to load mode: ${request.mode}`);
        }
      }

      // Step 4: Inject Memory (DYNAMIC)
      if (request.userId) {
        try {
          const memoryInjector = new MemoryInjector();
          const memoryContent = await memoryInjector.inject({
            userId: request.userId,
            conversationId: request.context?.conversationId,
            limit: 5
          });
          sections.push({
            name: PromptSectionType.MEMORY,
            content: memoryContent,
            source: 'dynamic/memory_injection.xml',
            required: false
          });
          variablesInjected.push('memories');
        } catch (error) {
          warnings.push('Failed to inject memory context');
        }
      }

      // Step 5: Build Runtime Context (DYNAMIC)
      if (request.context) {
        try {
          const contextAssembler = new ContextAssembler();
          
          // Add conversation history
          if (request.context.conversationHistory) {
            request.context.conversationHistory.forEach(msg => {
              contextAssembler.addConversation(`${msg.role}: ${msg.content}`);
            });
          }

          // Add current task context
          if (request.context.currentTask) {
            contextAssembler.addContext(`Current task: ${request.context.currentTask}`);
          }

          // Add emotional state
          if (request.context.emotionalState) {
            contextAssembler.addContext(`Emotional state: ${request.context.emotionalState}`);
          }

          // Add user goals
          if (request.context.userGoals) {
            contextAssembler.addContext(`User goals: ${request.context.userGoals.join(', ')}`);
          }

          const contextContent = contextAssembler.assemble(2000); // Limit context tokens
          sections.push({
            name: PromptSectionType.CONTEXT,
            content: `<runtime_context>\n${contextContent}\n</runtime_context>`,
            source: 'dynamic/context_injection.xml',
            required: false
          });
          variablesInjected.push('context');
        } catch (error) {
          warnings.push('Failed to build runtime context');
        }
      }

      // Step 6: Load Safety Boundaries (REQUIRED)
      const boundariesPrompt = PromptLoader.loadPrompt('core/boundaries.xml');
      sections.push({
        name: PromptSectionType.BOUNDARIES,
        content: boundariesPrompt,
        source: 'core/boundaries.xml',
        required: true
      });

      // Step 7: Combine and Optimize
      let combinedPrompt = this.combineSections(sections);
      
      // Step 8: Inject Variables
      if (request.variables && Object.keys(request.variables).length > 0) {
        combinedPrompt = VariableInjector.inject(combinedPrompt, request.variables);
        variablesInjected.push(...Object.keys(request.variables));
      }

      // Step 9: Optimize and Clean
      combinedPrompt = this.optimizePrompt(combinedPrompt);

      // Step 10: Validate
      const validation = this.validatePrompt(combinedPrompt);
      if (!validation.isValid) {
        warnings.push(...validation.errors);
      }

      const compilationTime = Date.now() - startTime;

      return {
        systemPrompt: combinedPrompt,
        sections,
        metadata: {
          compilationTime,
          totalSections: sections.length,
          variablesInjected,
          warnings
        }
      };

    } catch (error) {
      throw new Error(`Prompt compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Combines sections in correct order
   */
  private static combineSections(sections: any[]): string {
    const priorityOrder = [
      PromptSectionType.BASE,
      PromptSectionType.CREATIVE,
      PromptSectionType.MODE,
      PromptSectionType.MEMORY,
      PromptSectionType.CONTEXT,
      PromptSectionType.BOUNDARIES
    ];

    let combined = '';
    
    priorityOrder.forEach(sectionType => {
      const section = sections.find(s => s.name === sectionType);
      if (section) {
        combined += `\n<!-- ${section.name.toUpperCase()} -->\n`;
        combined += section.content;
        combined += '\n';
      }
    });

    return combined.trim();
  }

  /**
   * Optimizes prompt by removing duplicates and redundant content
   */
  private static optimizePrompt(prompt: string): string {
    // Remove duplicate XML declarations
    prompt = prompt.replace(/<\?xml[^>]*\?>/g, '');
    
    // Remove duplicate prompt root tags
    const promptOpenCount = (prompt.match(/<prompt>/g) || []).length;
    const promptCloseCount = (prompt.match(/<\/prompt>/g) || []).length;
    
    if (promptOpenCount > 1) {
      prompt = prompt.replace(/<prompt>/g, '');
    }
    if (promptCloseCount > 1) {
      prompt = prompt.replace(/<\/prompt>/g, '');
    }
    
    // Clean up excessive whitespace
    prompt = prompt.replace(/\n{3,}/g, '\n\n');
    prompt = prompt.replace(/\s{2,}/g, ' ');
    
    // Add single root tag if needed
    if (!prompt.includes('<prompt>') && !prompt.includes('</prompt>')) {
      prompt = `<prompt>\n${prompt}\n</prompt>`;
    }

    return prompt.trim();
  }

  /**
   * Validates compiled prompt
   */
  private static validatePrompt(prompt: string): PromptValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingRequired: string[] = [];
    const missingVariables: string[] = [];

    // Check XML validity
    try {
      // Basic XML validation - in production, use proper XML parser
      if (!prompt.includes('<prompt>') || !prompt.includes('</prompt>')) {
        errors.push('Prompt must have valid XML structure');
      }
    } catch (error) {
      errors.push('Invalid XML format');
    }

    // Check for required sections
    const requiredSections = ['base personality', 'safety boundaries'];
    requiredSections.forEach(section => {
      if (!prompt.toLowerCase().includes(section)) {
        missingRequired.push(section);
      }
    });

    // Check for unresolved variables
    const unresolvedVars = prompt.match(/{{\w+}}/g);
    if (unresolvedVars) {
      missingVariables.push(...unresolvedVars);
    }

    return {
      isValid: errors.length === 0 && missingRequired.length === 0,
      errors,
      warnings,
      missingRequired,
      missingVariables
    };
  }

  /**
   * Gets compilation statistics
   */
  static getCompilationStats(): {
    availablePersonalities: string[];
    availableModes: string[];
    availableCore: string[];
  } {
    return {
      availablePersonalities: PersonalityResolver.getAvailablePersonalities(),
      availableModes: ['brainstorm', 'critique', 'planning', 'motivation', 'deep-focus'],
      availableCore: ['base', 'boundaries', 'questioning', 'emotional']
    };
  }
}
