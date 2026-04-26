import { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface TestToolArguments {
  testType?: 'unit' | 'e2e' | 'all' | 'coverage';
  filePath?: string;
  pattern?: string;
}

export const TOOLS: Tool[] = [
  {
    name: 'run_tests',
    description: 'Run tests for the rlabel project',
    inputSchema: {
      type: 'object',
      properties: {
        testType: {
          type: 'string',
          enum: ['unit', 'e2e', 'all', 'coverage'],
          description: 'Type of tests to run'
        },
        filePath: {
          type: 'string',
          description: 'Specific test file path to run'
        },
        pattern: {
          type: 'string',
          description: 'Pattern to match test files'
        }
      }
    }
  },
  {
    name: 'get_test_results',
    description: 'Get the latest test results',
    inputSchema: {
      type: 'object',
      properties: {
        testType: {
          type: 'string',
          enum: ['unit', 'e2e', 'all'],
          description: 'Type of test results to retrieve'
        }
      }
    }
  },
  {
    name: 'get_test_coverage',
    description: 'Get test coverage report',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'list_test_files',
    description: 'List all test files in the project',
    inputSchema: {
      type: 'object',
      properties: {
        testType: {
          type: 'string',
          enum: ['unit', 'e2e', 'all'],
          description: 'Type of test files to list'
        }
      }
    }
  }
];
