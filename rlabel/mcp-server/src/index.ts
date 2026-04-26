#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TOOLS } from './tools/types.js';
import { AUTOMATION_TOOLS } from './tools/automationTypes.js';
import { TestRunner } from './tools/testRunner.js';
import { AutomationController } from './tools/automationController.js';

const testRunner = new TestRunner();
const automationController = new AutomationController();

const server = new Server(
  {
    name: 'rlabel-automation-server',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [...TOOLS, ...AUTOMATION_TOOLS],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'run_tests': {
        const testType = (args as any)?.testType || 'all';
        const filePath = (args as any)?.filePath;
        const pattern = (args as any)?.pattern;
        
        const result = await testRunner.runTests(testType, filePath, pattern);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'get_test_results': {
        const testType = (args as any)?.testType || 'all';
        const result = await testRunner.getTestResults(testType);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'get_test_coverage': {
        const result = await testRunner.getTestCoverage();
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'list_test_files': {
        const testType = (args as any)?.testType || 'all';
        const result = await testRunner.listTestFiles(testType);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'select_tool': {
        const tool = (args as any)?.tool;
        if (!tool) {
          throw new Error('Tool parameter is required');
        }
        const result = await automationController.selectTool(tool);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'control_zoom': {
        const action = (args as any)?.action;
        const value = (args as any)?.value;
        if (!action) {
          throw new Error('Action parameter is required');
        }
        const result = await automationController.controlZoom(action, value);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'create_annotation': {
        const type = (args as any)?.type;
        const points = (args as any)?.points;
        const label = (args as any)?.label;
        const color = (args as any)?.color;
        
        if (!type || !points) {
          throw new Error('Type and points parameters are required');
        }
        
        const result = await automationController.createAnnotation(type, points, label, color);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'select_annotation': {
        const annotationId = (args as any)?.annotationId;
        const isMultiSelect = (args as any)?.isMultiSelect;
        const selectAll = (args as any)?.selectAll;
        
        const result = await automationController.selectAnnotation(annotationId, isMultiSelect, selectAll);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'delete_annotation': {
        const annotationId = (args as any)?.annotationId;
        const result = await automationController.deleteAnnotation(annotationId);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'update_annotation': {
        const annotationId = (args as any)?.annotationId;
        const updateData = (args as any)?.updateData;
        
        if (!annotationId || !updateData) {
          throw new Error('AnnotationId and updateData parameters are required');
        }
        
        const result = await automationController.updateAnnotation(annotationId, updateData);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'load_image': {
        const action = (args as any)?.action;
        const filePath = (args as any)?.filePath;
        const index = (args as any)?.index;
        
        if (!action) {
          throw new Error('Action parameter is required');
        }
        
        const result = await automationController.loadImage(action, filePath, index);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'manage_labels': {
        const action = (args as any)?.action;
        const label = (args as any)?.label;
        const color = (args as any)?.color;
        
        if (!action) {
          throw new Error('Action parameter is required');
        }
        
        const result = await automationController.manageLabels(action, label, color);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'undo_redo': {
        const action = (args as any)?.action;
        
        if (!action) {
          throw new Error('Action parameter is required');
        }
        
        const result = await automationController.undoRedo(action);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'export_annotations': {
        const format = (args as any)?.format;
        const filePath = (args as any)?.filePath;
        
        if (!format) {
          throw new Error('Format parameter is required');
        }
        
        const result = await automationController.exportAnnotations(format, filePath);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'get_app_state': {
        const section = (args as any)?.section || 'all';
        const result = await automationController.getAppState(section);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'pan_canvas': {
        const x = (args as any)?.x;
        const y = (args as any)?.y;
        const action = (args as any)?.action;
        
        if (x === undefined || y === undefined || !action) {
          throw new Error('X, Y, and action parameters are required');
        }
        
        const result = await automationController.panCanvas(x, y, action);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'save_project': {
        const filePath = (args as any)?.filePath;
        const result = await automationController.saveProject(filePath);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'get_statistics': {
        const result = await automationController.getStatistics();
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('rlabel MCP Automation Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
