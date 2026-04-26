# rlabel MCP Server

MCP (Model Context Protocol) Server for running tests and automating the rlabel project.

## Features

This MCP server provides two categories of tools:

### Testing Tools
- **run_tests**: Run unit tests, E2E tests, or all tests
- **get_test_results**: Retrieve the latest test results
- **get_test_coverage**: Get test coverage reports
- **list_test_files**: List all test files in the project

### Automation Tools
- **select_tool**: Select a tool from the toolbar (select, point, line, polygon, rectangle, zoom)
- **control_zoom**: Control zoom level (zoom in, zoom out, reset, or set specific value)
- **create_annotation**: Create an annotation on the canvas
- **select_annotation**: Select an annotation or annotations on the canvas
- **delete_annotation**: Delete annotation(s)
- **update_annotation**: Update an existing annotation
- **load_image**: Load an image or navigate between images
- **manage_labels**: Manage labels (set current label, add new label, remove label)
- **undo_redo**: Perform undo or redo operation
- **export_annotations**: Export annotations to file
- **get_app_state**: Get current application state
- **pan_canvas**: Pan the canvas view
- **save_project**: Save the current project
- **get_statistics**: Get annotation statistics

## Installation

1. Install dependencies:
```bash
cd mcp-server
npm install
```

2. Build the server:
```bash
npm run build
```

## Usage

### Development Mode

Run the server in development mode with TypeScript:
```bash
npm run dev
```

### Production Mode

Run the built server:
```bash
npm start
```

### MCP Client Configuration

To use this MCP server with an MCP-compatible client (like Claude Desktop), add it to your MCP client configuration:

**Claude Desktop (macOS)**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Claude Desktop (Windows)**: `%APPDATA%\Claude\claude_desktop_config.json`

**Claude Desktop (Linux)**: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "rlabel-automation": {
      "command": "node",
      "args": ["D:\\Projects\\rustlabelme\\rlabel\\mcp-server\\dist\\index.js"],
      "cwd": "D:\\Projects\\rustlabelme\\rlabel"
    }
  }
}
```

## Available Tools

### Testing Tools

#### run_tests
Run tests for the rlabel project.

**Parameters:**
- `testType` (optional): Type of tests to run
  - `unit`: Run unit tests only
  - `e2e`: Run E2E tests only
  - `all`: Run all tests (default)
  - `coverage`: Run tests with coverage report
- `filePath` (optional): Specific test file path to run
- `pattern` (optional): Pattern to match test files

**Example:**
```
Run all unit tests with coverage report
```

#### get_test_results
Get the latest test results.

**Parameters:**
- `testType` (optional): Type of test results to retrieve
  - `unit`: Unit test results
  - `e2e`: E2E test results
  - `all`: Combined results (default)

**Example:**
```
Get the latest E2E test results
```

#### get_test_coverage
Get test coverage report.

**Example:**
```
Get the current test coverage report
```

#### list_test_files
List all test files in the project.

**Parameters:**
- `testType` (optional): Type of test files to list
  - `unit`: Unit test files
  - `e2e`: E2E test files
  - `all`: All test files (default)

**Example:**
```
List all unit test files
```

### Automation Tools

#### select_tool
Select a tool from the toolbar.

**Parameters:**
- `tool` (required): Tool to select
  - `select`: Selection tool
  - `point`: Point annotation tool
  - `line`: Line annotation tool
  - `polygon`: Polygon annotation tool
  - `rectangle`: Rectangle annotation tool
  - `zoom`: Zoom tool

**Example:**
```
Select the rectangle tool
```

#### control_zoom
Control zoom level.

**Parameters:**
- `action` (required): Zoom action
  - `zoom_in`: Increase zoom
  - `zoom_out`: Decrease zoom
  - `reset`: Reset zoom to 100%
  - `set`: Set specific zoom level
- `value` (optional): Zoom level (0.1 to 5.0) when action is "set"

**Example:**
```
Set zoom to 200%
```

#### create_annotation
Create an annotation on the canvas.

**Parameters:**
- `type` (required): Type of annotation
  - `point`: Point annotation (1 point)
  - `line`: Line annotation (2 points)
  - `polygon`: Polygon annotation (3+ points)
  - `rectangle`: Rectangle annotation (2 points)
- `points` (required): Array of points with x, y coordinates
- `label` (optional): Label for the annotation
- `color` (optional): Color in hex format (e.g., #FF0000)

**Example:**
```
Create a rectangle annotation
```

#### select_annotation
Select annotations on the canvas.

**Parameters:**
- `annotationId` (optional): ID of annotation to select
- `isMultiSelect` (optional): Add to current selection (Ctrl+Click)
- `selectAll` (optional): Select all annotations (Ctrl+A)

**Example:**
```
Select all annotations
```

#### delete_annotation
Delete annotation(s).

**Parameters:**
- `annotationId` (optional): ID of annotation to delete. If not provided, deletes all selected.

**Example:**
```
Delete the selected annotations
```

#### update_annotation
Update an existing annotation.

**Parameters:**
- `annotationId` (required): ID of annotation to update
- `updateData` (required): Data to update
  - `label`: New label
  - `color`: New color
  - `points`: New points array

**Example:**
```
Update annotation label to "person"
```

#### load_image
Load an image or navigate between images.

**Parameters:**
- `action` (required): Action to perform
  - `load`: Load a specific image
  - `next`: Go to next image
  - `prev`: Go to previous image
  - `by_index`: Load image by index
- `filePath` (optional): File path for "load" action
- `index` (optional): Image index for "by_index" action

**Example:**
```
Navigate to the next image
```

#### manage_labels
Manage labels.

**Parameters:**
- `action` (required): Action to perform
  - `set`: Set current label
  - `add`: Add new label
  - `remove`: Remove label
- `label` (optional): Label name
- `color` (optional): Label color (hex format)

**Example:**
```
Set current label to "vehicle"
```

#### undo_redo
Perform undo or redo operation.

**Parameters:**
- `action` (required): Action to perform
  - `undo`: Undo last operation
  - `redo`: Redo last undone operation

**Example:**
```
Undo the last operation
```

#### export_annotations
Export annotations to file.

**Parameters:**
- `format` (required): Export format
  - `json`: JSON format
  - `coco`: COCO format
  - `yolo`: YOLO format
  - `voc`: VOC format
- `filePath` (optional): File path to save

**Example:**
```
Export annotations in COCO format
```

#### get_app_state
Get current application state.

**Parameters:**
- `section` (optional): Section of state to retrieve
  - `all`: All sections (default)
  - `image`: Image information
  - `annotations`: Annotation count and details
  - `tools`: Current tool selection
  - `zoom`: Zoom level
  - `labels`: Current label and available labels

**Example:**
```
Get current application state
```

#### pan_canvas
Pan the canvas view.

**Parameters:**
- `x` (required): X offset in pixels
- `y` (required): Y offset in pixels
- `action` (required): Action type
  - `set`: Set absolute position
  - `relative`: Add to current position

**Example:**
```
Pan canvas by 100 pixels right and 50 pixels down
```

#### save_project
Save the current project.

**Parameters:**
- `filePath` (optional): File path to save

**Example:**
```
Save the current project
```

#### get_statistics
Get annotation statistics.

**Example:**
```
Get annotation statistics
```

## Automation Examples

See [AUTOMATION_TEST_EXAMPLES.md](./AUTOMATION_TEST_EXAMPLES.md) for comprehensive test examples and usage patterns.

### Quick Start Example

```javascript
// Start the rlabel application
await callTool('select_tool', { tool: 'rectangle' });
await callTool('manage_labels', { action: 'set', label: 'person' });
await callTool('create_annotation', {
  type: 'rectangle',
  points: [{ x: 100, y: 100 }, { x: 200, y: 200 }],
  label: 'person',
  color: '#FF0000'
});
await callTool('get_app_state', { section: 'all' });
```

## Project Structure

```
mcp-server/
├── src/
│   ├── index.ts                      # Main server entry point
│   └── tools/
│       ├── types.ts                  # Testing tool type definitions
│       ├── automationTypes.ts        # Automation tool type definitions
│       ├── testRunner.ts             # Test execution logic
│       └── automationController.ts   # UI automation logic using Playwright
├── dist/                             # Compiled JavaScript
├── package.json
├── tsconfig.json
├── README.md                         # This file
├── AUTOMATION_TEST_EXAMPLES.md       # Automation test examples
└── claude-mcp-config.json            # Claude configuration example
```

## Development

### Build

Compile TypeScript to JavaScript:
```bash
npm run build
```

### Requirements

For automation tools to work:
1. The rlabel application must be running
2. Development server should be accessible at `http://localhost:1420`
3. Start with: `npm run tauri dev` from the rlabel directory

## Troubleshooting

### Automation Tools Not Working

**Problem**: Automation tools return errors or don't work
**Solution**:
- Ensure the rlabel application is running on `http://localhost:1420`
- Check that the application is fully loaded
- Verify that the required DOM elements exist

### "Annotation not found" Errors

**Problem**: Cannot find annotations by ID
**Solution**:
- Use `get_app_state` to retrieve current annotation IDs
- Annotation IDs may change between runs
- Consider using `selectAll` instead of specific IDs

### Playwright Initialization Issues

**Problem**: Browser fails to initialize
**Solution**:
- Ensure Playwright browsers are installed: `npx playwright install`
- Check that no firewall/security software is blocking the browser
- Verify sufficient system resources are available

### Testing Issues

**Problem**: Test results not found
**Solution**:
- Ensure you have run tests at least once
- Check test output directories exist
- Verify test configuration is correct

## License

This MCP server is part of the rlabel project.
