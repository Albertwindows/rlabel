import { execa } from 'execa';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

const PROJECT_ROOT = process.cwd();
const MCP_SERVER_ROOT = join(PROJECT_ROOT, 'mcp-server');
const RLABEL_ROOT = join(MCP_SERVER_ROOT, '..');

export class TestRunner {
  private rlabelDir: string;

  constructor() {
    this.rlabelDir = RLABEL_ROOT;
  }

  async runTests(testType: 'unit' | 'e2e' | 'all' | 'coverage' = 'all', filePath?: string, pattern?: string): Promise<string> {
    let command: string;
    let args: string[] = ['--config', join(this.rlabelDir, 'package.json')];

    switch (testType) {
      case 'unit':
        command = 'npm';
        args = ['run', 'test'];
        break;
      case 'e2e':
        command = 'npm';
        args = ['run', 'test:e2e'];
        break;
      case 'all':
        command = 'npm';
        args = ['run', 'test:all'];
        break;
      case 'coverage':
        command = 'npm';
        args = ['run', 'test:coverage'];
        break;
      default:
        throw new Error(`Unknown test type: ${testType}`);
    }

    if (filePath) {
      args.push('--', filePath);
    }

    if (pattern) {
      args.push('--', pattern);
    }

    try {
      const result = await execa(command, args, {
        cwd: this.rlabelDir,
        timeout: 120000,
        env: {
          ...process.env,
          FORCE_COLOR: '0'
        }
      });

      return result.stdout;
    } catch (error: any) {
      if (error.exitCode === 1) {
        return error.stdout || error.stderr || 'Tests failed';
      }
      throw error;
    }
  }

  async getTestResults(testType: 'unit' | 'e2e' | 'all' = 'all'): Promise<string> {
    const resultFiles = {
      unit: join(this.rlabelDir, 'dist', 'vitest-results.json'),
      e2e: join(this.rlabelDir, 'playwright-report', 'results.json'),
      all: join(this.rlabelDir, 'dist', 'combined-results.json')
    };

    const resultFile = resultFiles[testType];

    if (!existsSync(resultFile)) {
      return `No test results found for ${testType}. Please run tests first.`;
    }

    try {
      const content = await readFile(resultFile, 'utf-8');
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch (error) {
      return `Failed to read test results: ${error}`;
    }
  }

  async getTestCoverage(): Promise<string> {
    const coverageFile = join(this.rlabelDir, 'dist', 'coverage', 'coverage-summary.json');

    if (!existsSync(coverageFile)) {
      return 'No coverage report found. Please run tests with coverage first using "test:coverage".';
    }

    try {
      const content = await readFile(coverageFile, 'utf-8');
      const data = JSON.parse(content);
      
      let report = '# Test Coverage Report\n\n';
      report += '| File | Statements | Branches | Functions | Lines |\n';
      report += '|------|-----------|----------|-----------|-------|\n';
      
      for (const [file, metrics] of Object.entries(data)) {
        const m = metrics as any;
        report += `| ${file} | ${m.statements.pct}% | ${m.branches.pct}% | ${m.functions.pct}% | ${m.lines.pct}% |\n`;
      }
      
      report += `\n**Total:** ${data.total.statements.pct}% statements, ${data.total.branches.pct}% branches, ${data.total.functions.pct}% functions, ${data.total.lines.pct}% lines`;
      
      return report;
    } catch (error) {
      return `Failed to read coverage report: ${error}`;
    }
  }

  async listTestFiles(testType: 'unit' | 'e2e' | 'all' = 'all'): Promise<string> {
    const glob = await import('fast-glob');
    const path = await import('path');
    
    const patterns: Record<string, string[]> = {
      unit: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
      e2e: ['tests/**/*.spec.ts'],
      all: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx', 'tests/**/*.spec.ts']
    };

    const files = await glob.default(patterns[testType], {
      cwd: this.rlabelDir,
      absolute: false
    });

    if (files.length === 0) {
      return `No test files found for ${testType} tests.`;
    }

    let result = `# Test Files (${testType})\n\n`;
    files.forEach((file: string) => {
      const relativePath = path.default.relative(this.rlabelDir, file);
      result += `- ${relativePath}\n`;
    });

    return result;
  }
}
