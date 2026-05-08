# AI Prompt System Architecture

## Overview

This system implements a sophisticated prompt compilation architecture that separates concerns, maintains strict responsibilities, and enables dynamic AI personality adaptation.

## Architecture Philosophy

### Core Principles

1. **Separation of Concerns**: Each component has a single, well-defined responsibility
2. **Static XML Prompts**: XML files contain ONLY behavior definitions, no runtime data
3. **Dynamic Injection**: Runtime data (memories, context, variables) injected separately
4. **Modular Composition**: Base + Creative + Mode + Memory + Context + Boundaries
5. **Type Safety**: Full TypeScript support with comprehensive interfaces

## System Flow

```
API Route → ConversationService → PromptCompiler → Final System Prompt → OpenAI
```

### Detailed Flow

1. **API Route** receives user request
2. **ConversationService** orchestrates the prompt compilation
3. **PromptCompiler** (THE BRAIN) coordinates all components
4. **Component Loading** in strict order:
   - Base Personality (REQUIRED)
   - Creative Personality (OPTIONAL)
   - Mode (OPTIONAL)
   - Memory Injection (DYNAMIC)
   - Context Assembly (DYNAMIC)
   - Safety Boundaries (REQUIRED)
5. **Final Prompt** sent to AI model
6. **Response Processing** for metadata and analysis

## Component Responsibilities

### 🔧 PromptLoader.ts
**ONLY loads XML files**
```typescript
static loadPrompt(fileName: string): string
```
- Reads XML from filesystem
- Returns raw XML content
- NO processing or modification
- NO caching (handled elsewhere)

### 🎯 PersonalityResolver.ts
**Chooses creative personality based on user type**
```typescript
static resolvePersonality(userType: string): string
```
- Maps user types to personality files
- Handles fallbacks gracefully
- Validates personality types
- NO XML processing

### 🔄 VariableInjector.ts
**Replaces {{variable}} placeholders**
```typescript
static inject(xmlContent: string, variables: VariableMap): string
```
- Simple string replacement
- Extracts placeholders for validation
- NO logic or processing
- Type-safe variable handling

### 🧠 MemoryInjector.ts
**Injects user memories into XML format**
```typescript
async inject(context: MemoryContext): Promise<string>
```
- Fetches long-term and recent memories
- Formats as XML memory blocks
- Handles memory scoring and relevance
- XML escaping for safety

### 📋 ContextAssembler.ts
**Builds runtime context from conversation data**
```typescript
assemble(maxTokens?: number): string
```
- Gathers conversation history, current task, emotional state
- Formats as structured XML context
- Token-aware assembly
- Priority-based sorting

### 🧠 PromptCompiler.ts
**MAIN BRAIN - Coordinates entire compilation**
```typescript
static async compile(request: PromptCompilationRequest): Promise<CompiledPrompt>
```
**Compilation Order:**
1. Load Base Personality (REQUIRED)
2. Load Creative Personality (OPTIONAL)
3. Load Mode (OPTIONAL)
4. Inject Memory (DYNAMIC)
5. Build Runtime Context (DYNAMIC)
6. Load Safety Boundaries (REQUIRED)
7. Combine sections in correct order
8. Inject variables
9. Optimize and clean
10. Validate final prompt

**Optimizations:**
- Remove duplicate XML declarations
- Eliminate redundant content
- Clean whitespace
- Validate structure
- Enforce token limits

### 📤 ResponsePostProcessor.ts
**Processes AI responses after generation**
```typescript
static process(response: string, startTime: number): ProcessedResponse
```
- Response cleaning and formatting
- Sentiment analysis
- Confidence scoring
- Word count and timing metadata
- Quality assessment

## XML Structure

### Static XML Files (NO runtime data)

#### Core Prompts
- `base.xml` - Fundamental AI behavior and principles
- `questioning.xml` - Socratic questioning techniques
- `emotional.xml` - Empathetic response guidelines
- `boundaries.xml` - Safety and ethical constraints

#### Creative Personalities
- `writer.xml` - Writing assistance and creative guidance
- `musician.xml` - Music theory and composition help
- `filmmaker.xml` - Film production and direction
- `director.xml` - Creative direction and brand strategy

#### Modes
- `brainstorm.xml` - Idea generation techniques
- `critique.xml` - Constructive feedback methods
- `planning.xml` - Structured planning approaches
- `motivation.xml` - Encouragement and support strategies

#### Templates
- `system-template.xml` - Master template structure definition

### Variable System
**Only in runtime injection:**
```xml
<variables>
  <variable name="user_name">User's preferred name</variable>
  <variable name="current_task">Current work focus</variable>
  <variable name="user_goals">Stated objectives</variable>
  <variable name="emotional_state">Current emotional context</variable>
</variables>
```

**NEVER in static XML:**
- User-specific memories
- Conversation history
- Temporary states
- Runtime context

## Usage Examples

### Basic Usage
```typescript
const response = await ConversationService.chat({
  user: {
    id: 'user123',
    type: 'writer',
    name: 'Alice'
  },
  message: "I can't finish my novel",
  mode: 'motivation',
  context: {
    currentTask: 'Writing sci-fi novel',
    emotionalState: 'frustrated',
    goals: ['Complete first draft', 'Develop characters']
  }
});
```

### Generated Prompt Structure
```xml
<prompt>
<!-- BASE_PERSONALITY -->
<base>...</base>

<!-- CREATIVE_PERSONALITY -->
<writer>...</writer>

<!-- MODE -->
<motivation>...</motivation>

<!-- RUNTIME_MEMORY -->
<memory>
  <item>User struggles with finishing projects</item>
  <item>Working on sci-fi novel</item>
</memory>

<!-- RUNTIME_CONTEXT -->
<runtime_context>
  Current task: Writing sci-fi novel
  Emotional state: frustrated
  User goals: Complete first draft, Develop characters
</runtime_context>

<!-- SAFETY_BOUNDARIES -->
<boundaries>...</boundaries>
</prompt>
```

## Best Practices

### ✅ DO
- Keep XML files focused on behavior and rules
- Use clear, descriptive variable names
- Implement proper error handling and fallbacks
- Validate all inputs before processing
- Use TypeScript interfaces for type safety
- Document component responsibilities clearly
- Test prompt compilation thoroughly

### ❌ DON'T
- Mix runtime data with static XML
- Create monolithic prompt files
- Hardcode user-specific information
- Ignore error handling and validation
- Skip optimization and cleanup steps
- Assume all optional components are available

## Error Handling

### Component-Level Errors
- **PromptLoader**: File not found, invalid XML
- **PersonalityResolver**: Invalid user type, missing personality file
- **VariableInjector**: Missing required variables, invalid format
- **MemoryInjector**: Database errors, memory access issues
- **ContextAssembler**: Invalid context data, token limit exceeded
- **PromptCompiler**: Compilation failures, validation errors

### Graceful Degradation
- Fallback to default personality when specific one fails
- Continue with partial data when memory injection fails
- Use base prompt only when optional components unavailable
- Provide helpful error messages for debugging

## Performance Considerations

### Optimization Strategies
- **Caching**: Cache loaded XML files in memory
- **Lazy Loading**: Load optional components only when needed
- **Token Management**: Monitor and limit prompt length
- **Async Operations**: Use async/await for I/O operations
- **Memory Management**: Clean up unused data promptly

### Metrics to Track
- Compilation time per request
- Component loading success/failure rates
- Token usage efficiency
- Memory injection performance
- Error frequency and types

## Testing Strategy

### Unit Tests
- Test each component in isolation
- Mock external dependencies
- Validate error handling paths
- Test edge cases and boundary conditions

### Integration Tests
- Test full prompt compilation flow
- Verify component interaction
- Test with real OpenAI responses
- Validate output format and quality

### Prompt Testing
- Test with various user types and modes
- Validate variable injection accuracy
- Test memory and context integration
- Measure response quality and consistency

## Deployment Considerations

### Environment Variables
```bash
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4
DATABASE_URL=your_database_url
```

### File Structure
```
src/core/ai/
├── engine/
│   ├── PromptLoader.ts
│   ├── PromptBuilder.ts
│   ├── ContextAssembler.ts
│   ├── PromptLoader.ts
│   ├── VariableInjector.ts
│   ├── MemoryInjector.ts
│   ├── PersonalityResolver.ts
│   └── ResponsePostProcessor.ts
├── prompts/
│   ├── core/
│   ├── creatives/
│   ├── modes/
│   └── templates/
├── memory/
├── testing/
└── types/
```

## Future Enhancements

### Planned Features
- **Prompt Versioning**: Track and manage prompt versions
- **A/B Testing**: Compare prompt performance
- **Dynamic Personalities**: Generate personalities from user behavior
- **Advanced Memory**: Vector search and semantic matching
- **Real-time Adaptation**: Adjust prompts based on conversation flow
- **Performance Analytics**: Detailed metrics and optimization suggestions

### Extension Points
- Custom personality loaders
- Alternative memory systems
- Additional prompt formats (JSON, YAML)
- Custom variable injectors
- External prompt sources

---

This architecture ensures maintainable, scalable, and robust prompt management while keeping strict separation of concerns and enabling sophisticated AI personality adaptation.
