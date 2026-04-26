import { test, expect, Page } from '@playwright/test'

test.describe('Application Launch', () => {
  test('should launch application', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    // Check if main elements are present
    await expect(page.locator('h1')).toContainText('RLabel - Image Annotation Tool')
    await expect(page.locator('.sidebar')).toBeVisible()
    await expect(page.locator('.canvas-container')).toBeVisible()
  })

  test('should have all tools available', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    // Check toolbar buttons
    const tools = ['Select', 'Point', 'Line', 'Polygon', 'Rectangle', 'Zoom']
    for (const tool of tools) {
      await expect(page.getByTitle(tool)).toBeVisible()
    }
  })

  test('should have default labels', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    // Check default labels
    await expect(page.getByLabel('Label')).toBeVisible()
  })
})

test.describe('Image Loading', () => {
  test('should show empty canvas initially', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    await expect(page.getByText('No image loaded')).toBeVisible()
    await expect(page.getByText('Open an image to start annotating')).toBeVisible()
  })

  test('should open image dialog when clicking open image button', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    const openButton = page.getByText('Open Image')
    await openButton.click()
    
    // Note: In a real test, we'd need to mock the file dialog
    // For now, we just verify the button is clickable
    await expect(openButton).toBeVisible()
  })
})

test.describe('Tool Selection', () => {
  test('should select point tool', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    const pointButton = page.getByTitle('Point')
    await pointButton.click()
    
    await expect(pointButton).toHaveClass(/active/)
  })

  test('should select rectangle tool', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    const rectButton = page.getByTitle('Rectangle')
    await rectButton.click()
    
    await expect(rectButton).toHaveClass(/active/)
  })

  test('should switch between tools', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    const pointButton = page.getByTitle('Point')
    const lineButton = page.getByTitle('Line')
    
    await pointButton.click()
    await expect(pointButton).toHaveClass(/active/)
    
    await lineButton.click()
    await expect(lineButton).toHaveClass(/active/)
    await expect(pointButton).not.toHaveClass(/active/)
  })
})

test.describe('Annotation List', () => {
  test('should show empty annotation list initially', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    await expect(page.getByText('No annotations yet')).toBeVisible()
  })

  test('should display annotation count', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    await expect(page.locator('.annotation-count')).toContainText('0 annotations')
  })
})

test.describe('Label Selection', () => {
  test('should have label selector', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    await expect(page.getByLabel('Label')).toBeVisible()
  })

  test('should have color palette', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    const colorPalette = page.locator('.color-palette')
    await expect(colorPalette).toBeVisible()
  })
})

test.describe('Zoom Controls', () => {
  test('should have zoom controls', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    await expect(page.getByTitle('Zoom In')).toBeVisible()
    await expect(page.getByTitle('Zoom Out')).toBeVisible()
    await expect(page.getByTitle('Reset View')).toBeVisible()
  })

  test('should display zoom level', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    await expect(page.locator('.zoom-value')).toContainText('100%')
  })
})

test.describe('Responsive Design', () => {
  test('should adapt to different screen sizes', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    // Test different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('.sidebar')).toBeVisible()
    
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('.sidebar')).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should have keyboard accessible buttons', async ({ page }) => {
    await page.goto('http://localhost:1420')
    
    const tools = ['Point', 'Line', 'Polygon', 'Rectangle']
    for (const tool of tools) {
      const button = page.getByTitle(tool)
      await expect(button).toBeVisible()
      await expect(button).toBeEnabled()
    }
  })
})

test.describe('Performance', () => {
  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
  })

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await page.goto('http://localhost:1420')
    await page.waitForLoadState('networkidle')
    
    expect(errors).toHaveLength(0)
  })
})
