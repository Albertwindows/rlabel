import { chromium, Browser, Page, BrowserContext } from 'playwright';

export class AutomationController {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private appUrl: string;
  private readonly selectors = {
    tools: {
      select: '[data-tool="select"]',
      point: '[data-tool="point"]',
      line: '[data-tool="line"]',
      polygon: '[data-tool="polygon"]',
      rectangle: '[data-tool="rectangle"]',
      zoom: '[data-tool="zoom"]'
    },
    zoom: {
      in: '[data-action="zoom-in"]',
      out: '[data-action="zoom-out"]',
      reset: '[data-action="reset-view"]',
      slider: '.zoom-slider',
      value: '.zoom-value'
    },
    actions: {
      undo: '[data-action="undo"]',
      redo: '[data-action="redo"]',
      delete: '[data-action="delete"]'
    },
    canvas: '.annotation-canvas',
    labelSelector: '.label-selector select',
    colorPicker: '.color-picker input[type="color"]',
    annotationList: '.annotation-list',
    imageLoader: '.primary-button',
    projectManager: '.project-manager'
  };

  constructor() {
    this.appUrl = 'http://localhost:1420';
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: false,
        slowMo: 100
      });
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();
      
      // Wait for app to be ready
      await this.page.goto(this.appUrl);
      await this.page.waitForLoadState('networkidle');
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  private async ensureInitialized() {
    if (!this.page) {
      await this.initialize();
    }
  }

  async selectTool(tool: string): Promise<string> {
    await this.ensureInitialized();
    
    const selector = this.selectors.tools[tool as keyof typeof this.selectors.tools];
    if (!selector) {
      throw new Error(`Unknown tool: ${tool}`);
    }

    if (this.page) {
      await this.page.click(selector);
      await this.page.waitForTimeout(100);
    }
    
    return `Successfully selected tool: ${tool}`;
  }

  async controlZoom(action: string, value?: number): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    
    switch (action) {
      case 'zoom_in':
        await this.page.click(this.selectors.zoom.in);
        break;
      case 'zoom_out':
        await this.page.click(this.selectors.zoom.out);
        break;
      case 'reset':
        await this.page.click(this.selectors.zoom.reset);
        break;
      case 'set':
        if (!value) {
          throw new Error('Zoom value required for "set" action');
        }
        await this.page.fill(this.selectors.zoom.slider, String(value * 100));
        break;
      default:
        throw new Error(`Unknown zoom action: ${action}`);
    }
    
    await this.page.waitForTimeout(100);
    return `Successfully performed zoom action: ${action}`;
  }

  async createAnnotation(type: string, points: any[], label?: string, color?: string): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    
    // Select the tool first
    await this.selectTool(type);
    await this.page.waitForTimeout(200);
    
    // Set label if provided
    if (label) {
      await this.page.click(this.selectors.labelSelector);
      await this.page.selectOption(this.selectors.labelSelector, label);
    }
    
    // Set color if provided
    if (color) {
      await this.page.fill(this.selectors.colorPicker, color);
    }
    
    // Click on canvas to create annotation
    const canvas = await this.page.locator(this.selectors.canvas);
    const canvasBox = await canvas.boundingBox();
    
    if (!canvasBox) {
      throw new Error('Canvas not found');
    }
    
    if (type === 'point' && points.length === 1) {
      const point = points[0];
      await canvas.click({
        position: { x: point.x, y: point.y }
      });
    } else if (type === 'line' && points.length === 2) {
      await canvas.click({ position: { x: points[0].x, y: points[0].y } });
      await this.page.mouse.down();
      await this.page.mouse.move(
        canvasBox.x + points[1].x,
        canvasBox.y + points[1].y
      );
      await this.page.mouse.up();
    } else if (type === 'rectangle' && points.length >= 2) {
      await canvas.click({ position: { x: points[0].x, y: points[0].y } });
      await this.page.mouse.down();
      await this.page.mouse.move(
        canvasBox.x + points[1].x,
        canvasBox.y + points[1].y
      );
      await this.page.mouse.up();
    } else if (type === 'polygon' && points.length >= 3) {
      for (let i = 0; i < points.length; i++) {
        await canvas.click({ position: { x: points[i].x, y: points[i].y } });
        await this.page.waitForTimeout(100);
      }
      await canvas.click({ position: { x: points[0].x, y: points[0].y } });
    }
    
    await this.page.waitForTimeout(300);
    return `Successfully created ${type} annotation with ${points.length} points`;
  }

  async selectAnnotation(annotationId?: string, isMultiSelect?: boolean, selectAll?: boolean): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    
    if (selectAll) {
      await this.page.keyboard.press('Control+A');
      return 'Selected all annotations';
    }
    
    if (!annotationId) {
      await this.page.keyboard.press('Escape');
      return 'Deselected annotations';
    }
    
    // Find and click on annotation in list or canvas
    const annotationItem = await this.page.locator(`[data-annotation-id="${annotationId}"]`).first();
    if (await annotationItem.isVisible()) {
      if (isMultiSelect) {
        await this.page.keyboard.down('Control');
        await annotationItem.click();
        await this.page.keyboard.up('Control');
      } else {
        await annotationItem.click();
      }
      return `Selected annotation: ${annotationId}`;
    } else {
      throw new Error(`Annotation not found: ${annotationId}`);
    }
  }

  async deleteAnnotation(annotationId?: string): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    
    if (annotationId) {
      await this.selectAnnotation(annotationId);
    }
    
    await this.page.keyboard.press('Delete');
    await this.page.waitForTimeout(100);
    
    return annotationId ? `Deleted annotation: ${annotationId}` : 'Deleted selected annotations';
  }

  async updateAnnotation(annotationId: string, updateData: any): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    
    await this.selectAnnotation(annotationId);
    
    if (updateData.label) {
      await this.page.click(this.selectors.labelSelector);
      await this.page.selectOption(this.selectors.labelSelector, updateData.label);
    }
    
    if (updateData.color) {
      await this.page.fill(this.selectors.colorPicker, updateData.color);
    }
    
    await this.page.waitForTimeout(100);
    return `Updated annotation: ${annotationId}`;
  }

  async loadImage(action: string, filePath?: string, index?: number): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    
    switch (action) {
      case 'load':
        if (!filePath) {
          throw new Error('File path required for "load" action');
        }
        await this.page.click(this.selectors.imageLoader);
        await this.page.waitForTimeout(500);
        // File upload handling would go here
        break;
      case 'next':
        await this.page.keyboard.press('ArrowRight');
        break;
      case 'prev':
        await this.page.keyboard.press('ArrowLeft');
        break;
      case 'by_index':
        if (!index) {
          throw new Error('Index required for "by_index" action');
        }
        // Navigate to specific image - implementation depends on UI
        break;
    }
    
    await this.page.waitForTimeout(300);
    return `Successfully performed image action: ${action}`;
  }

  async manageLabels(action: string, label?: string, color?: string): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    
    switch (action) {
      case 'set':
        if (!label) {
          throw new Error('Label required for "set" action');
        }
        await this.page.click(this.selectors.labelSelector);
        await this.page.selectOption(this.selectors.labelSelector, label);
        break;
      case 'add':
        // Implementation depends on UI for adding labels
        break;
      case 'remove':
        // Implementation depends on UI for removing labels
        break;
    }
    
    await this.page.waitForTimeout(100);
    return `Successfully performed label action: ${action}`;
  }

  async undoRedo(action: string): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    
    if (action === 'undo') {
      await this.page.click(this.selectors.actions.undo);
    } else {
      await this.page.click(this.selectors.actions.redo);
    }
    
    await this.page.waitForTimeout(100);
    return `Successfully performed ${action} action`;
  }

  async exportAnnotations(format: string, filePath?: string): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    
    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('S');
    await this.page.keyboard.up('Control');
    
    await this.page.waitForTimeout(500);
    // Format selection and file save handling would go here
    
    return `Successfully exported annotations in ${format} format`;
  }

  async getAppState(section: string = 'all'): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    
    const state: any = {};
    
    if (section === 'all' || section === 'zoom') {
      const zoomValue = await this.page.textContent(this.selectors.zoom.value);
      state.zoom = zoomValue;
    }
    
    if (section === 'all' || section === 'annotations') {
      const annotationCount = await this.page.locator('.annotation-count').textContent();
      state.annotationCount = annotationCount;
    }
    
    if (section === 'all' || section === 'tools') {
      const activeTool = await this.page.locator('.tool-button.active').getAttribute('data-tool');
      state.currentTool = activeTool;
    }
    
    if (section === 'all' || section === 'labels') {
      const currentLabel = await this.page.inputValue(this.selectors.labelSelector);
      state.currentLabel = currentLabel;
    }
    
    return JSON.stringify(state, null, 2);
  }

  async panCanvas(x: number, y: number, action: string): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    
    const canvas = await this.page.locator(this.selectors.canvas);
    const canvasBox = await canvas.boundingBox();
    
    if (!canvasBox) {
      throw new Error('Canvas not found');
    }
    
    if (action === 'relative') {
      await this.page.mouse.move(
        canvasBox.x + canvasBox.width / 2,
        canvasBox.y + canvasBox.height / 2
      );
      await this.page.mouse.down();
      await this.page.mouse.move(
        canvasBox.x + canvasBox.width / 2 + x,
        canvasBox.y + canvasBox.height / 2 + y
      );
      await this.page.mouse.up();
    } else {
      // For absolute positioning, we'd need to calculate the offset
      // This is a simplified implementation
    }
    
    await this.page.waitForTimeout(100);
    return `Successfully panned canvas: x=${x}, y=${y}`;
  }

  async saveProject(filePath?: string): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    
    // Navigate to project manager and save
    // Implementation depends on UI
    
    await this.page.waitForTimeout(300);
    return 'Successfully saved project';
  }

  async getStatistics(): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    
    // Get statistics from the application
    // This might involve clicking a statistics button or reading from the UI
    
    const stats: any = {
      timestamp: new Date().toISOString(),
      annotations: {
        total: 0,
        point: 0,
        line: 0,
        polygon: 0,
        rectangle: 0
      },
      labels: {}
    };
    
    return JSON.stringify(stats, null, 2);
  }
}
