import { PromptTester, TestResult, TestSuite } from './PromptTester';

export interface EvaluationConfig {
  parallel: boolean;
  maxConcurrency: number;
  timeout: number;
  retries: number;
}

export interface EvaluationReport {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageScore: number;
  averageExecutionTime: number;
  results: TestResult[];
  summary: EvaluationSummary;
}

export interface EvaluationSummary {
  byCategory: Record<string, CategorySummary>;
  byPrompt: Record<string, PromptSummary>;
  overallPerformance: PerformanceMetrics;
}

export interface CategorySummary {
  category: string;
  totalTests: number;
  passedTests: number;
  averageScore: number;
  averageExecutionTime: number;
}

export interface PromptSummary {
  promptId: string;
  promptName: string;
  totalTests: number;
  passedTests: number;
  averageScore: number;
  averageExecutionTime: number;
  bestScore: number;
  worstScore: number;
}

export interface PerformanceMetrics {
  totalExecutionTime: number;
  fastestTest: number;
  slowestTest: number;
  successRate: number;
  scoreDistribution: Record<string, number>;
}

export class EvaluationRunner {
  private tester: PromptTester;
  private config: EvaluationConfig;

  constructor(tester: PromptTester, config: Partial<EvaluationConfig> = {}) {
    this.tester = tester;
    this.config = {
      parallel: true,
      maxConcurrency: 5,
      timeout: 30000, // 30 seconds
      retries: 2,
      ...config
    };
  }

  async runFullEvaluation(
    name: string,
    executor: (prompt: string) => Promise<string>
  ): Promise<EvaluationReport> {
    const startTime = new Date();
    const id = this.generateEvaluationId();

    console.log(`Starting evaluation: ${name} (${id})`);

    // Get all test suites
    const testSuites = this.tester.getAllTestSuites();
    const allResults: TestResult[] = [];

    if (this.config.parallel) {
      // Run suites in parallel
      const suitePromises = testSuites.map(suite => 
        this.runTestSuiteWithRetry(suite.id, executor)
      );
      const suiteResults = await Promise.all(suitePromises);
      allResults.push(...suiteResults.flat());
    } else {
      // Run suites sequentially
      for (const suite of testSuites) {
        const suiteResults = await this.runTestSuiteWithRetry(suite.id, executor);
        allResults.push(...suiteResults);
      }
    }

    const endTime = new Date();
    const report = this.generateReport(id, name, startTime, endTime, allResults);

    console.log(`Evaluation completed: ${name}`);
    console.log(`Total tests: ${report.totalTests}, Passed: ${report.passedTests}, Failed: ${report.failedTests}`);

    return report;
  }

  async runCategoryEvaluation(
    category: string,
    executor: (prompt: string) => Promise<string>
  ): Promise<EvaluationReport> {
    const startTime = new Date();
    const id = this.generateEvaluationId();
    const name = `Category Evaluation: ${category}`;

    console.log(`Starting category evaluation: ${category}`);

    const results = await this.tester.runCategoryTests(category, executor);
    const endTime = new Date();
    const report = this.generateReport(id, name, startTime, endTime, results);

    console.log(`Category evaluation completed: ${category}`);
    return report;
  }

  async runPromptEvaluation(
    promptIds: string[],
    executor: (prompt: string) => Promise<string>
  ): Promise<EvaluationReport> {
    const startTime = new Date();
    const id = this.generateEvaluationId();
    const name = `Prompt Evaluation: ${promptIds.join(', ')}`;

    console.log(`Starting prompt evaluation for ${promptIds.length} prompts`);

    const allResults: TestResult[] = [];

    for (const promptId of promptIds) {
      const prompt = this.tester.getPrompt(promptId);
      if (!prompt) {
        console.warn(`Prompt ${promptId} not found, skipping`);
        continue;
      }

      const testCases = this.generateTestCasesForPrompt(prompt);
      
      for (const testCase of testCases) {
        try {
          const result = await this.runSingleTestWithRetry(promptId, testCase, executor);
          allResults.push(result);
        } catch (error) {
          console.error(`Failed to test prompt ${promptId} with case ${testCase.name}:`, error);
        }
      }
    }

    const endTime = new Date();
    const report = this.generateReport(id, name, startTime, endTime, allResults);

    console.log(`Prompt evaluation completed`);
    return report;
  }

  private async runTestSuiteWithRetry(
    suiteId: string,
    executor: (prompt: string) => Promise<string>
  ): Promise<TestResult[]> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        return await this.tester.runTestSuite(suiteId, executor);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Test suite ${suiteId} attempt ${attempt + 1} failed:`, error);
        
        if (attempt < this.config.retries) {
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
        }
      }
    }

    throw lastError || new Error(`Test suite ${suiteId} failed after ${this.config.retries + 1} attempts`);
  }

  private async runSingleTestWithRetry(
    promptId: string,
    testCase: any,
    executor: (prompt: string) => Promise<string>
  ): Promise<TestResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        return await Promise.race([
          this.tester.runSingleTest(promptId, testCase, executor),
          this.timeout(this.config.timeout)
        ]);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Test attempt ${attempt + 1} failed:`, error);
        
        if (attempt < this.config.retries) {
          await this.delay(500 * (attempt + 1));
        }
      }
    }

    throw lastError || new Error(`Test failed after ${this.config.retries + 1} attempts`);
  }

  private generateTestCasesForPrompt(prompt: any): any[] {
    // This would generate appropriate test cases for the prompt
    // For now, return a basic test case
    return [
      {
        id: `auto_${prompt.id}_1`,
        name: 'Auto-generated Test',
        input: { user_input: 'Test input' },
        evaluationCriteria: ['helpful', 'professional']
      }
    ];
  }

  private generateReport(
    id: string,
    name: string,
    startTime: Date,
    endTime: Date,
    results: TestResult[]
  ): EvaluationReport {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalTests || 0;
    const averageExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / totalTests || 0;

    const summary = this.generateSummary(results);

    return {
      id,
      name,
      startTime,
      endTime,
      totalTests,
      passedTests,
      failedTests,
      averageScore,
      averageExecutionTime,
      results,
      summary
    };
  }

  private generateSummary(results: TestResult[]): EvaluationSummary {
    const byCategory: Record<string, CategorySummary> = {};
    const byPrompt: Record<string, PromptSummary> = {};

    // Group by category
    results.forEach(result => {
      const prompt = this.tester.getPrompt(result.promptId);
      const category = prompt?.category || 'unknown';

      if (!byCategory[category]) {
        byCategory[category] = {
          category,
          totalTests: 0,
          passedTests: 0,
          averageScore: 0,
          averageExecutionTime: 0
        };
      }

      byCategory[category].totalTests++;
      if (result.passed) byCategory[category].passedTests++;
    });

    // Calculate averages for categories
    Object.values(byCategory).forEach(category => {
      const categoryResults = results.filter(r => {
        const prompt = this.tester.getPrompt(r.promptId);
        return prompt?.category === category.category;
      });

      category.averageScore = categoryResults.reduce((sum, r) => sum + r.score, 0) / categoryResults.length || 0;
      category.averageExecutionTime = categoryResults.reduce((sum, r) => sum + r.executionTime, 0) / categoryResults.length || 0;
    });

    // Group by prompt
    results.forEach(result => {
      const prompt = this.tester.getPrompt(result.promptId);
      const promptName = prompt?.name || result.promptId;

      if (!byPrompt[result.promptId]) {
        byPrompt[result.promptId] = {
          promptId: result.promptId,
          promptName,
          totalTests: 0,
          passedTests: 0,
          averageScore: 0,
          averageExecutionTime: 0,
          bestScore: 0,
          worstScore: 100
        };
      }

      byPrompt[result.promptId].totalTests++;
      if (result.passed) byPrompt[result.promptId].passedTests++;
      byPrompt[result.promptId].bestScore = Math.max(byPrompt[result.promptId].bestScore, result.score);
      byPrompt[result.promptId].worstScore = Math.min(byPrompt[result.promptId].worstScore, result.score);
    });

    // Calculate averages for prompts
    Object.values(byPrompt).forEach(prompt => {
      const promptResults = results.filter(r => r.promptId === prompt.promptId);
      prompt.averageScore = promptResults.reduce((sum, r) => sum + r.score, 0) / promptResults.length || 0;
      prompt.averageExecutionTime = promptResults.reduce((sum, r) => sum + r.executionTime, 0) / promptResults.length || 0;
    });

    const overallPerformance = this.calculatePerformanceMetrics(results);

    return {
      byCategory,
      byPrompt,
      overallPerformance
    };
  }

  private calculatePerformanceMetrics(results: TestResult[]): PerformanceMetrics {
    const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
    const fastestTest = Math.min(...results.map(r => r.executionTime));
    const slowestTest = Math.max(...results.map(r => r.executionTime));
    const successRate = results.filter(r => r.passed).length / results.length || 0;

    const scoreDistribution: Record<string, number> = {
      '90-100': 0,
      '80-89': 0,
      '70-79': 0,
      '60-69': 0,
      '50-59': 0,
      '0-49': 0
    };

    results.forEach(result => {
      if (result.score >= 90) scoreDistribution['90-100']++;
      else if (result.score >= 80) scoreDistribution['80-89']++;
      else if (result.score >= 70) scoreDistribution['70-79']++;
      else if (result.score >= 60) scoreDistribution['60-69']++;
      else if (result.score >= 50) scoreDistribution['50-59']++;
      else scoreDistribution['0-49']++;
    });

    return {
      totalExecutionTime,
      fastestTest,
      slowestTest,
      successRate,
      scoreDistribution
    };
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Test timed out after ${ms}ms`)), ms);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateEvaluationId(): string {
    return `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async exportReport(report: EvaluationReport): Promise<string> {
    return JSON.stringify(report, null, 2);
  }

  async generateMarkdownReport(report: EvaluationReport): Promise<string> {
    const markdown = `
# Evaluation Report: ${report.name}

## Summary
- **Total Tests**: ${report.totalTests}
- **Passed**: ${report.passedTests} (${((report.passedTests / report.totalTests) * 100).toFixed(1)}%)
- **Failed**: ${report.failedTests} (${((report.failedTests / report.totalTests) * 100).toFixed(1)}%)
- **Average Score**: ${report.averageScore.toFixed(2)}
- **Average Execution Time**: ${report.averageExecutionTime.toFixed(0)}ms

## Performance by Category
${Object.values(report.summary.byCategory).map(cat => `
### ${cat.category}
- Tests: ${cat.totalTests}
- Pass Rate: ${((cat.passedTests / cat.totalTests) * 100).toFixed(1)}%
- Average Score: ${cat.averageScore.toFixed(2)}
- Avg Time: ${cat.averageExecutionTime.toFixed(0)}ms
`).join('')}

## Performance by Prompt
${Object.values(report.summary.byPrompt).map(prompt => `
### ${prompt.promptName}
- Tests: ${prompt.totalTests}
- Pass Rate: ${((prompt.passedTests / prompt.totalTests) * 100).toFixed(1)}%
- Average Score: ${prompt.averageScore.toFixed(2)}
- Score Range: ${prompt.worstScore.toFixed(1)} - ${prompt.bestScore.toFixed(1)}
- Avg Time: ${prompt.averageExecutionTime.toFixed(0)}ms
`).join('')}

## Score Distribution
${Object.entries(report.summary.overallPerformance.scoreDistribution).map(([range, count]) => 
  `- ${range}: ${count} tests`
).join('\n')}

---
*Report generated on ${report.endTime.toISOString()}*
    `.trim();

    return markdown;
  }
}
