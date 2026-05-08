export interface TestPrompt {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: string;
  expectedBehavior: string;
}

export interface TestResult {
  promptId: string;
  testName: string;
  passed: boolean;
  score: number;
  response: string;
  evaluation: string;
  executionTime: number;
  timestamp: Date;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  prompts: TestPrompt[];
  testCases: TestCase[];
}

export interface TestCase {
  id: string;
  name: string;
  input: Record<string, string>;
  expectedOutput?: string;
  evaluationCriteria: string[];
}

export class PromptTester {
  private prompts: Map<string, TestPrompt> = new Map();
  private results: TestResult[] = [];
  private suites: Map<string, TestSuite> = new Map();

  async addPrompt(prompt: TestPrompt): Promise<void> {
    this.prompts.set(prompt.id, prompt);
  }

  getPrompt(id: string): TestPrompt | null {
    return this.prompts.get(id) || null;
  }

  getAllPrompts(): TestPrompt[] {
    return Array.from(this.prompts.values());
  }

  async createTestSuite(suite: TestSuite): Promise<void> {
    this.suites.set(suite.id, suite);
  }

  getTestSuite(id: string): TestSuite | null {
    return this.suites.get(id) || null;
  }

  getAllTestSuites(): TestSuite[] {
    return Array.from(this.suites.values());
  }

  async runSingleTest(
    promptId: string, 
    testCase: TestCase, 
    executor: (prompt: string) => Promise<string>
  ): Promise<TestResult> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) {
      throw new Error(`Prompt with ID ${promptId} not found`);
    }

    const startTime = Date.now();
    
    // Compile the prompt with test case variables
    const compiledPrompt = this.compilePrompt(prompt.template, testCase.input);
    
    // Execute the prompt
    const response = await executor(compiledPrompt);
    
    const executionTime = Date.now() - startTime;
    
    // Evaluate the response
    const evaluation = await this.evaluateResponse(response, testCase);
    
    const result: TestResult = {
      promptId,
      testName: testCase.name,
      passed: evaluation.passed,
      score: evaluation.score,
      response,
      evaluation: evaluation.feedback,
      executionTime,
      timestamp: new Date()
    };

    this.results.push(result);
    return result;
  }

  async runTestSuite(
    suiteId: string, 
    executor: (prompt: string) => Promise<string>
  ): Promise<TestResult[]> {
    const suite = this.suites.get(suiteId);
    if (!suite) {
      throw new Error(`Test suite with ID ${suiteId} not found`);
    }

    const results: TestResult[] = [];

    for (const testCase of suite.testCases) {
      for (const prompt of suite.prompts) {
        try {
          const result = await this.runSingleTest(prompt.id, testCase, executor);
          results.push(result);
        } catch (error) {
          console.error(`Test failed for prompt ${prompt.id}, case ${testCase.name}:`, error);
        }
      }
    }

    return results;
  }

  async runCategoryTests(
    category: string, 
    executor: (prompt: string) => Promise<string>
  ): Promise<TestResult[]> {
    const categoryPrompts = Array.from(this.prompts.values())
      .filter(prompt => prompt.category === category);

    const results: TestResult[] = [];

    for (const prompt of categoryPrompts) {
      const testCases = this.generateTestCasesForPrompt(prompt);
      
      for (const testCase of testCases) {
        try {
          const result = await this.runSingleTest(prompt.id, testCase, executor);
          results.push(result);
        } catch (error) {
          console.error(`Category test failed for prompt ${prompt.id}:`, error);
        }
      }
    }

    return results;
  }

  private compilePrompt(template: string, variables: Record<string, string>): string {
    let compiled = template;
    
    for (const [key, value] of Object.entries(variables)) {
      compiled = compiled.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    
    return compiled;
  }

  private async evaluateResponse(
    response: string, 
    testCase: TestCase
  ): Promise<{ passed: boolean; score: number; feedback: string }> {
    let score = 0;
    let feedback = '';

    // Basic evaluation criteria
    if (testCase.expectedOutput) {
      const similarity = this.calculateSimilarity(response, testCase.expectedOutput);
      score += similarity * 50;
      feedback += `Content similarity: ${(similarity * 100).toFixed(1)}%\n`;
    }

    // Length evaluation
    const expectedLength = testCase.expectedOutput?.length || 100;
    const actualLength = response.length;
    const lengthScore = Math.max(0, 1 - Math.abs(actualLength - expectedLength) / expectedLength);
    score += lengthScore * 20;
    feedback += `Length appropriateness: ${(lengthScore * 100).toFixed(1)}%\n`;

    // Custom evaluation criteria
    for (const criterion of testCase.evaluationCriteria) {
      const criterionScore = this.evaluateCriterion(response, criterion);
      score += criterionScore * (30 / testCase.evaluationCriteria.length);
      feedback += `${criterion}: ${(criterionScore * 100).toFixed(1)}%\n`;
    }

    const passed = score >= 70; // 70% threshold

    return {
      passed,
      score: Math.min(score, 100),
      feedback: feedback.trim()
    };
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private evaluateCriterion(response: string, criterion: string): number {
    const lowerResponse = response.toLowerCase();
    const lowerCriterion = criterion.toLowerCase();

    if (lowerCriterion.includes('helpful')) {
      const helpfulWords = ['help', 'assist', 'guide', 'support', 'useful'];
      return helpfulWords.some(word => lowerResponse.includes(word)) ? 1 : 0.5;
    }

    if (lowerCriterion.includes('professional')) {
      const unprofessionalWords = ['lol', 'omg', 'whatever', 'whatever'];
      return !unprofessionalWords.some(word => lowerResponse.includes(word)) ? 1 : 0.3;
    }

    if (lowerCriterion.includes('detailed')) {
      return response.length > 100 ? 1 : response.length > 50 ? 0.7 : 0.3;
    }

    if (lowerCriterion.includes('empathetic')) {
      const empatheticWords = ['understand', 'feel', 'sorry', 'difficult', 'challenging'];
      return empatheticWords.some(word => lowerResponse.includes(word)) ? 1 : 0.5;
    }

    // Default evaluation
    return 0.7;
  }

  private generateTestCasesForPrompt(prompt: TestPrompt): TestCase[] {
    const testCases: TestCase[] = [];

    // Generate basic test cases based on prompt variables
    if (prompt.variables.includes('user_input')) {
      testCases.push({
        id: `basic_${prompt.id}`,
        name: 'Basic Input Test',
        input: { user_input: 'Hello, how are you?' },
        evaluationCriteria: ['helpful', 'professional']
      });
    }

    if (prompt.variables.includes('context')) {
      testCases.push({
        id: `context_${prompt.id}`,
        name: 'Context Test',
        input: { 
          user_input: 'What should I do next?',
          context: 'The user is working on a software project'
        },
        evaluationCriteria: ['relevant', 'detailed']
      });
    }

    return testCases;
  }

  getTestResults(promptId?: string): TestResult[] {
    if (promptId) {
      return this.results.filter(result => result.promptId === promptId);
    }
    return [...this.results];
  }

  getTestStats(): {
    totalTests: number;
    passedTests: number;
    averageScore: number;
    averageExecutionTime: number;
  } {
    if (this.results.length === 0) {
      return {
        totalTests: 0,
        passedTests: 0,
        averageScore: 0,
        averageExecutionTime: 0
      };
    }

    const passedTests = this.results.filter(result => result.passed).length;
    const averageScore = this.results.reduce((sum, result) => sum + result.score, 0) / this.results.length;
    const averageExecutionTime = this.results.reduce((sum, result) => sum + result.executionTime, 0) / this.results.length;

    return {
      totalTests: this.results.length,
      passedTests,
      averageScore,
      averageExecutionTime
    };
  }

  clearResults(): void {
    this.results = [];
  }

  exportResults(): string {
    return JSON.stringify({
      results: this.results,
      stats: this.getTestStats(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}
