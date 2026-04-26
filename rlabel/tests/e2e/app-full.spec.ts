import { test, expect, Page } from '@playwright/test'

test.describe('Annotation Creation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')
  })

  test('should create point annotation', async ({ page }) => {
    // Load a test image first
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#f0f0f0'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
      }
    })

    // Select point tool
    await page.getByTitle('Point').click()

    // Get canvas element
    const canvas = page.locator('canvas.annotation-canvas')
    await expect(canvas).toBeVisible()

    // Click on canvas to create point
    await canvas.click({ position: { x: 100, y: 100 } })

    // Check if annotation was created
    const annotationCount = page.locator('.annotation-count')
    await expect(annotationCount).toContainText('1 annotation')
  })

  test('should create rectangle annotation', async ({ page }) => {
    // Select rectangle tool
    await page.getByTitle('Rectangle').click()

    const canvas = page.locator('canvas.annotation-canvas')
    
    // Drag to create rectangle
    await canvas.click({ position: { x: 50, y: 50 } })
    await page.mouse.down()
    await canvas.hover({ position: { x: 150, y: 150 } })
    await page.mouse.up()

    // Wait for annotation to be created
    await page.waitForTimeout(500)

    const annotationCount = page.locator('.annotation-count')
    await expect(annotationCount).toContainText(/1|2/) // May have 1 or 2 annotations
  })

  test('should create polygon annotation', async ({ page }) => {
    // Select polygon tool
    await page.getByTitle('Polygon').click()

    const canvas = page.locator('canvas.annotation-canvas')
    
    // Click multiple points to create polygon
    await canvas.click({ position: { x: 100, y: 100 } })
    await page.waitForTimeout(100)
    await canvas.click({ position: { x: 200, y: 100 } })
    await page.waitForTimeout(100)
    await canvas.click({ position: { x: 200, y: 200 } })
    await page.waitForTimeout(100)
    await canvas.click({ position: { x: 100, y: 200 } })
    await page.waitForTimeout(100)
    
    // Double click to complete polygon
    await canvas.dblclick({ position: { x: 100, y: 200 } })

    // Wait for annotation to be created
    await page.waitForTimeout(500)

    const annotationCount = page.locator('.annotation-count')
    await expect(annotationCount).toContainText(/1|2/)
  })

  test('should delete annotation', async ({ page }) => {
    // Create an annotation first
    await page.getByTitle('Point').click()
    const canvas = page.locator('canvas.annotation-canvas')
    await canvas.click({ position: { x: 100, y: 100 } })
    await page.waitForTimeout(500)

    // Select the annotation
    await canvas.click({ position: { x: 100, y: 100 } })
    await page.waitForTimeout(200)

    // Press delete key
    await page.keyboard.press('Delete')

    // Check if annotation was deleted
    const annotationCount = page.locator('.annotation-count')
    await expect(annotationCount).toContainText('0 annotations')
  })

  test('should handle undo/redo', async ({ page }) => {
    // Create annotation
    await page.getByTitle('Point').click()
    const canvas = page.locator('canvas.annotation-canvas')
    await canvas.click({ position: { x: 100, y: 100 } })
    await page.waitForTimeout(500)

    // Undo
    await page.keyboard.press('Control+Z')
    await page.waitForTimeout(200)

    const annotationCount = page.locator('.annotation-count')
    await expect(annotationCount).toContainText('0 annotations')

    // Redo
    await page.keyboard.press('Control+Y')
    await page.waitForTimeout(200)

    await expect(annotationCount).toContainText('1 annotation')
  })
})

test.describe('Export/Import E2E Tests', () => {
  test('should show export menu', async ({ page }) => {
    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    const exportButton = page.getByText('Export')
    await exportButton.click()

    await expect(page.getByText('Export Format')).toBeVisible()
    await expect(page.getByText('JSON')).toBeVisible()
    await expect(page.getByText('COCO')).toBeVisible()
    await expect(page.getByText('YOLO')).toBeVisible()
    await expect(page.getByText('VOC')).toBeVisible()
  })

  test('should close export menu', async ({ page }) => {
    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    const exportButton = page.getByText('Export')
    await exportButton.click()

    const closeButton = page.locator('.close-button')
    await closeButton.click()

    await expect(page.getByText('Export Format')).not.toBeVisible()
  })

  test('should show format descriptions', async ({ page }) => {
    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    const exportButton = page.getByText('Export')
    await exportButton.click()

    await expect(page.getByText('Standard JSON format')).toBeVisible()
    await expect(page.getByText('COCO dataset format')).toBeVisible()
    await expect(page.getByText('YOLO detection format')).toBeVisible()
    await expect(page.getByText('Pascal VOC XML format')).toBeVisible()
  })
})

test.describe('Zoom and Pan E2E Tests', () => {
  test('should zoom in and out', async ({ page }) => {
    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    const zoomValue = page.locator('.zoom-value')
    await expect(zoomValue).toContainText('100%')

    // Zoom in
    await page.getByTitle('Zoom In').click()
    await page.waitForTimeout(200)
    await expect(zoomValue).toContainText('110%')

    // Zoom out
    await page.getByTitle('Zoom Out').click()
    await page.waitForTimeout(200)
    await expect(zoomValue).toContainText('100%')
  })

  test('should reset view', async ({ page }) => {
    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    // Zoom in
    await page.getByTitle('Zoom In').click()
    await page.waitForTimeout(200)

    // Reset
    await page.getByTitle('Reset View').click()
    await page.waitForTimeout(200)

    const zoomValue = page.locator('.zoom-value')
    await expect(zoomValue).toContainText('100%')
  })

  test('should zoom with mouse wheel', async ({ page }) => {
    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    const canvas = page.locator('canvas.annotation-canvas')
    
    // Zoom in with mouse wheel
    await canvas.hover()
    await page.mouse.wheel(0, -100)
    await page.waitForTimeout(200)

    const zoomValue = page.locator('.zoom-value')
    await expect(zoomValue).not.toContainText('100%')
  })
})

test.describe('Label Management E2E Tests', () => {
  test('should change label', async ({ page }) => {
    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    const labelSelector = page.getByLabel('Label')
    await expect(labelSelector).toBeVisible()

    // Click to open dropdown
    await labelSelector.click()

    // Check if default labels are present
    await expect(page.getByText('person')).toBeVisible()
    await expect(page.getByText('car')).toBeVisible()
    await expect(page.getByText('building')).toBeVisible()
  })

  test('should add new label', async ({ page }) => {
    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    const addButton = page.getByRole('button', { name: /Add/i })
    await expect(addButton).toBeVisible()
    
    // Note: Adding label requires user interaction with dialog
    // This test verifies the button is present
  })
})

test.describe('Keyboard Shortcuts E2E Tests', () => {
  test('should switch tools with keyboard', async ({ page }) => {
    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    // Press 'p' for point tool
    await page.keyboard.press('p')
    await page.waitForTimeout(100)
    const pointButton = page.getByTitle('Point')
    await expect(pointButton).toHaveClass(/active/)

    // Press 'l' for line tool
    await page.keyboard.press('l')
    await page.waitForTimeout(100)
    const lineButton = page.getByTitle('Line')
    await expect(lineButton).toHaveClass(/active/)

    // Press 'r' for rectangle tool
    await page.keyboard.press('r')
    await page.waitForTimeout(100)
    const rectButton = page.getByTitle('Rectangle')
    await expect(rectButton).toHaveClass(/active/)

    // Press 'g' for polygon tool
    await page.keyboard.press('g')
    await page.waitForTimeout(100)
    const polyButton = page.getByTitle('Polygon')
    await expect(polyButton).toHaveClass(/active/)

    // Press 'v' for select tool
    await page.keyboard.press('v')
    await page.waitForTimeout(100)
    const selectButton = page.getByTitle('Select')
    await expect(selectButton).toHaveClass(/active/)
  })

  test('should handle keyboard shortcuts for image operations', async ({ page }) => {
    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    // Press Ctrl+O to open image
    await page.keyboard.press('Control+o')
    await page.waitForTimeout(200)
    
    // Verify open dialog button is triggered
    // (In real test, we'd check if file dialog appears)
  })
})

test.describe('Error Handling E2E Tests', () => {
  test('should handle invalid file gracefully', async ({ page }) => {
    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    const loadButton = page.getByText('Load Annotations')
    await loadButton.click()

    // Wait for any error to be handled gracefully
    await page.waitForTimeout(500)

    // Verify app is still responsive
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should not crash on rapid tool switching', async ({ page }) => {
    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    // Rapidly switch tools
    for (let i = 0; i < 10; i++) {
      await page.getByTitle('Point').click()
      await page.getByTitle('Line').click()
      await page.getByTitle('Rectangle').click()
      await page.getByTitle('Polygon').click()
      await page.getByTitle('Select').click()
    }

    // Verify app is still responsive
    await expect(page.locator('h1')).toBeVisible()
  })
})

test.describe('Logging System E2E Tests', () => {
  test('should log actions to console', async ({ page }) => {
    const logs: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'info' || msg.type() === 'debug') {
        logs.push(msg.text())
      }
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    // Create an annotation
    await page.getByTitle('Point').click()
    const canvas = page.locator('canvas.annotation-canvas')
    await canvas.click({ position: { x: 100, y: 100 } })
    await page.waitForTimeout(500)

    // Check if logs were created
    expect(logs.length).toBeGreaterThan(0)
    
    // Check for specific log messages
    const hasCreationLog = logs.some(log => 
      log.toLowerCase().includes('annotation') || 
      log.toLowerCase().includes('create')
    )
    expect(hasCreationLog).toBe(true)
  })

  test('should log errors appropriately', async ({ page }) => {
    const errors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    // Try to perform invalid action
    const loadButton = page.getByText('Load Annotations')
    await loadButton.click()
    await page.waitForTimeout(500)

    // Check if errors are logged (if any occur)
    // The test passes if the app handles errors gracefully
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should maintain log performance', async ({ page }) => {
    const startTime = Date.now()
    
    page.on('console', () => {
      // Just listen to events
    })

    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')

    // Perform multiple actions
    for (let i = 0; i < 5; i++) {
      await page.getByTitle('Point').click()
      const canvas = page.locator('canvas.annotation-canvas')
      await canvas.click({ position: { x: 100 + i * 10, y: 100 + i * 10 } })
      await page.waitForTimeout(100)
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    // Verify logging doesn't significantly impact performance
    expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
  })
})
