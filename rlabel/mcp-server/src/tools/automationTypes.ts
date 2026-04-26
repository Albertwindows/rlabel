import { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ToolbarAction {
  action: 'select' | 'point' | 'line' | 'polygon' | 'rectangle' | 'zoom';
}

export interface ZoomAction {
  action: 'zoom_in' | 'zoom_out' | 'reset' | 'set';
  value?: number;
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CreateAnnotationAction {
  type: 'point' | 'line' | 'polygon' | 'rectangle';
  points: CanvasPoint[];
  label?: string;
  color?: string;
}

export interface SelectAnnotationAction {
  annotationId?: string;
  isMultiSelect?: boolean;
  selectAll?: boolean;
}

export interface AnnotationAction {
  action: 'delete' | 'update';
  annotationId: string;
  updateData?: any;
}

export interface ImageAction {
  action: 'load' | 'navigate';
  filePath?: string;
  direction?: 'next' | 'prev';
  index?: number;
}

export interface LabelAction {
  action: 'set' | 'add' | 'remove';
  label?: string;
  color?: string;
}

export const AUTOMATION_TOOLS: Tool[] = [
  {
    name: 'select_tool',
    description: 'Select a tool from the toolbar (select, point, line, polygon, rectangle, zoom)',
    inputSchema: {
      type: 'object',
      properties: {
        tool: {
          type: 'string',
          enum: ['select', 'point', 'line', 'polygon', 'rectangle', 'zoom'],
          description: 'Tool to select'
        }
      },
      required: ['tool']
    }
  },
  {
    name: 'control_zoom',
    description: 'Control zoom level (zoom in, zoom out, reset, or set specific value)',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['zoom_in', 'zoom_out', 'reset', 'set'],
          description: 'Zoom action to perform'
        },
        value: {
          type: 'number',
          description: 'Zoom level when action is "set" (0.1 to 5.0)'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'create_annotation',
    description: 'Create an annotation on the canvas',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['point', 'line', 'polygon', 'rectangle'],
          description: 'Type of annotation to create'
        },
        points: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' }
            },
            required: ['x', 'y']
          },
          description: 'Array of points (canvas coordinates)'
        },
        label: {
          type: 'string',
          description: 'Label for the annotation'
        },
        color: {
          type: 'string',
          description: 'Color for the annotation (hex format, e.g., #FF0000)'
        }
      },
      required: ['type', 'points']
    }
  },
  {
    name: 'select_annotation',
    description: 'Select an annotation or annotations on the canvas',
    inputSchema: {
      type: 'object',
      properties: {
        annotationId: {
          type: 'string',
          description: 'ID of annotation to select (or empty to deselect)'
        },
        isMultiSelect: {
          type: 'boolean',
          description: 'Whether to add to current selection'
        },
        selectAll: {
          type: 'boolean',
          description: 'Whether to select all annotations'
        }
      }
    }
  },
  {
    name: 'delete_annotation',
    description: 'Delete annotation(s)',
    inputSchema: {
      type: 'object',
      properties: {
        annotationId: {
          type: 'string',
          description: 'ID of annotation to delete (or empty to delete all selected)'
        }
      }
    }
  },
  {
    name: 'update_annotation',
    description: 'Update an existing annotation',
    inputSchema: {
      type: 'object',
      properties: {
        annotationId: {
          type: 'string',
          description: 'ID of annotation to update'
        },
        updateData: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            color: { type: 'string' },
            points: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' }
                }
              }
            }
          }
        }
      },
      required: ['annotationId', 'updateData']
    }
  },
  {
    name: 'load_image',
    description: 'Load an image or navigate between images',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['load', 'next', 'prev', 'by_index'],
          description: 'Action to perform'
        },
        filePath: {
          type: 'string',
          description: 'File path of image to load (for "load" action)'
        },
        index: {
          type: 'number',
          description: 'Image index to load (for "by_index" action)'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'manage_labels',
    description: 'Manage labels (set current label, add new label, remove label)',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['set', 'add', 'remove'],
          description: 'Action to perform'
        },
        label: {
          type: 'string',
          description: 'Label name'
        },
        color: {
          type: 'string',
          description: 'Color for the label (hex format)'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'undo_redo',
    description: 'Perform undo or redo operation',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['undo', 'redo'],
          description: 'Action to perform'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'export_annotations',
    description: 'Export annotations to file',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['json', 'coco', 'yolo', 'voc'],
          description: 'Export format'
        },
        filePath: {
          type: 'string',
          description: 'File path to save (optional, will show dialog if not provided)'
        }
      },
      required: ['format']
    }
  },
  {
    name: 'get_app_state',
    description: 'Get current application state',
    inputSchema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: ['all', 'image', 'annotations', 'tools', 'zoom', 'labels'],
          description: 'Section of state to retrieve'
        }
      }
    }
  },
  {
    name: 'pan_canvas',
    description: 'Pan the canvas view',
    inputSchema: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'Pan X offset in pixels'
        },
        y: {
          type: 'number',
          description: 'Pan Y offset in pixels'
        },
        action: {
          type: 'string',
          enum: ['set', 'relative'],
          description: 'Action: set absolute position or add to current position'
        }
      },
      required: ['x', 'y', 'action']
    }
  },
  {
    name: 'save_project',
    description: 'Save the current project',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'File path to save (optional, will show dialog if not provided)'
        }
      }
    }
  },
  {
    name: 'get_statistics',
    description: 'Get annotation statistics',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];
