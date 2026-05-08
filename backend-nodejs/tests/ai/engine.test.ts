import { PromptBuilder } from '../../src/core/ai/engine/PromptBuilder';
import { PromptCompiler } from '../../src/core/ai/engine/PromptCompiler';
import { ContextAssembler } from '../../src/core/ai/engine/ContextAssembler';
import { ResponseAnalyzer } from '../../src/core/ai/engine/ResponseAnalyzer';

describe('AI Engine Tests', () => {
  describe('PromptBuilder', () => {
    let builder: PromptBuilder;

    beforeEach(() => {
      builder = new PromptBuilder();
    });

    test('should build empty prompt', () => {
      const prompt = builder.build();
      expect(prompt).toBe('');
    });

    test('should add system prompt', () => {
      const prompt = builder
        .addSystemPrompt('You are a helpful assistant.')
        .build();
      
      expect(prompt).toContain('System: You are a helpful assistant.');
    });

    test('should add user message', () => {
      const prompt = builder
        .addUserMessage('Hello, how are you?')
        .build();
      
      expect(prompt).toContain('User: Hello, how are you?');
    });

    test('should add context', () => {
      const prompt = builder
        .addContext('User is working on a project')
        .build();
      
      expect(prompt).toContain('Context: User is working on a project');
    });

    test('should build complex prompt', () => {
      const prompt = builder
        .addSystemPrompt('You are a helpful assistant.')
        .addContext('User is working on a Node.js project')
        .addUserMessage('How do I create a server?')
        .build();
      
      expect(prompt).toContain('System: You are a helpful assistant.');
      expect(prompt).toContain('Context: User is working on a Node.js project');
      expect(prompt).toContain('User: How do I create a server?');
    });

    test('should reset builder', () => {
      builder
        .addSystemPrompt('System message')
        .addUserMessage('User message');
      
      const beforeReset = builder.build();
      expect(beforeReset).toContain('System message');
      expect(beforeReset).toContain('User message');

      const afterReset = builder.reset().build();
      expect(afterReset).toBe('');
    });
  });

  describe('PromptCompiler', () => {
    let compiler: PromptCompiler;

    beforeEach(() => {
      compiler = new PromptCompiler();
    });

    test('should compile simple template', () => {
      const template = compiler.createTemplate('test', 'Hello {{name}}!');
      const result = compiler.compile(template, { name: 'World' });
      
      expect(result).toBe('Hello World!');
    });

    test('should handle multiple variables', () => {
      const template = compiler.createTemplate('test', '{{greeting}} {{name}}, how are you {{time}}?');
      const result = compiler.compile(template, {
        greeting: 'Good morning',
        name: 'Alice',
        time: 'today'
      });
      
      expect(result).toBe('Good morning Alice, how are you today?');
    });

    test('should handle missing variables', () => {
      const template = compiler.createTemplate('test', 'Hello {{name}}!');
      const result = compiler.compile(template, {});
      
      expect(result).toBe('Hello {{name}}!');
    });

    test('should extract variables from template', () => {
      const variables = compiler.extractVariables('Hello {{name}}, your {{type}} is ready');
      expect(variables).toEqual(['name', 'type']);
    });

    test('should handle repeated variables', () => {
      const template = compiler.createTemplate('test', '{{name}} says hello to {{name}}');
      const result = compiler.compile(template, { name: 'Bob' });
      
      expect(result).toBe('Bob says hello to Bob');
    });
  });

  describe('ContextAssembler', () => {
    let assembler: ContextAssembler;

    beforeEach(() => {
      assembler = new ContextAssembler();
    });

    test('should assemble empty context', () => {
      const context = assembler.assemble();
      expect(context).toBe('');
    });

    test('should add memory item', () => {
      const context = assembler
        .addMemory('User prefers TypeScript')
        .assemble();
      
      expect(context).toContain('[MEMORY] User prefers TypeScript');
    });

    test('should add conversation item', () => {
      const context = assembler
        .addConversation('User: Help me with code')
        .assemble();
      
      expect(context).toContain('[CONVERSATION] User: Help me with code');
    });

    test('should add document item', () => {
      const context = assembler
        .addDocument('Project documentation content')
        .assemble();
      
      expect(context).toContain('[DOCUMENT] Project documentation content');
    });

    test('should sort by relevance', () => {
      const context = assembler
        .addMemory('Low relevance info', 0.3)
        .addMemory('High relevance info', 0.9)
        .assemble();
      
      expect(context.indexOf('High relevance info')).toBeLessThan(
        expect(context.indexOf('Low relevance info'))
      );
    });

    test('should respect token limit', () => {
      const longContent = 'a'.repeat(1000);
      const context = assembler
        .addMemory(longContent)
        .assemble(100); // Very small limit
      
      expect(context.length).toBeLessThan(100);
    });

    test('should clear assembler', () => {
      assembler
        .addMemory('Some memory')
        .addConversation('Some conversation');
      
      const beforeClear = assembler.assemble();
      expect(beforeClear).toContain('Some memory');
      expect(beforeClear).toContain('Some conversation');

      const afterClear = assembler.clear().assemble();
      expect(afterClear).toBe('');
    });
  });

  describe('ResponseAnalyzer', () => {
    let analyzer: ResponseAnalyzer;

    beforeEach(() => {
      analyzer = new ResponseAnalyzer();
    });

    test('should analyze positive sentiment', () => {
      const result = analyzer.analyzeResponse('This is great and amazing!');
      
      expect(result.sentiment).toBe('positive');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should analyze negative sentiment', () => {
      const result = analyzer.analyzeResponse('This is terrible and awful.');
      
      expect(result.sentiment).toBe('negative');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should analyze neutral sentiment', () => {
      const result = analyzer.analyzeResponse('This is a statement.');
      
      expect(result.sentiment).toBe('neutral');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should extract topics', () => {
      const result = analyzer.analyzeResponse('I love programming with JavaScript and TypeScript');
      
      expect(result.topics).toContain('programming');
      expect(result.topics).toContain('javascript');
      expect(result.topics).toContain('typescript');
    });

    test('should extract entities', () => {
      const result = analyzer.analyzeResponse('Contact me at user@example.com or visit https://example.com');
      
      expect(result.entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'user@example.com', type: 'email' }),
          expect.objectContaining({ name: 'https://example.com', type: 'url' })
        ])
      );
    });

    test('should provide suggestions for negative responses', () => {
      const result = analyzer.analyzeResponse('This is bad');
      
      expect(result.suggestions).toContain('Consider rephrasing for a more positive tone');
    });

    test('should provide suggestions for short responses', () => {
      const result = analyzer.analyzeResponse('OK');
      
      expect(result.suggestions).toContain('Provide more detailed response');
    });

    test('should calculate higher confidence for longer responses', () => {
      const shortResult = analyzer.analyzeResponse('OK');
      const longResult = analyzer.analyzeResponse('This is a very detailed and well-structured response that provides comprehensive information about the topic at hand, demonstrating good communication skills and thoughtful consideration.');
      
      expect(longResult.confidence).toBeGreaterThan(shortResult.confidence);
    });
  });
});
