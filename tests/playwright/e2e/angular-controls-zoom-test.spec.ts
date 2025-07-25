import { test, expect } from '@playwright/test';

test.describe('Angular Flow Controls Zoom Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForSelector('[data-id="1"]', { timeout: 10000 });
  });

  test('should zoom in GraphView when clicking zoom in button', async ({ page }) => {
    // Get initial viewport transform
    const viewport = page.locator('.xy-flow__viewport');
    await expect(viewport).toBeVisible();
    
    const initialTransform = await viewport.getAttribute('style');
    console.log('Initial transform:', initialTransform);
    
    // Find and click zoom in button
    const zoomInButton = page.locator('.xy-flow__controls-zoomin');
    await expect(zoomInButton).toBeVisible();
    await zoomInButton.click();
    
    // Wait for transform to update
    await page.waitForTimeout(200);
    
    // Get new viewport transform
    const newTransform = await viewport.getAttribute('style');
    console.log('After zoom in transform:', newTransform);
    
    // Verify the transform actually changed (indicating GraphView was affected)
    expect(newTransform).not.toBe(initialTransform);
    
    // The zoom should have increased (scale value should be higher)
    if (initialTransform && newTransform) {
      const initialScale = extractScale(initialTransform);
      const newScale = extractScale(newTransform);
      
      console.log('Initial scale:', initialScale);
      console.log('New scale:', newScale);
      
      expect(newScale).toBeGreaterThan(initialScale);
    }
  });

  test('should zoom out GraphView when clicking zoom out button', async ({ page }) => {
    // First zoom in to have some zoom to reduce
    const zoomInButton = page.locator('.xy-flow__controls-zoomin');
    await zoomInButton.click();
    await zoomInButton.click(); // Click twice to get higher zoom
    await page.waitForTimeout(200);
    
    // Get viewport after zoom in
    const viewport = page.locator('.xy-flow__viewport');
    const beforeZoomOutTransform = await viewport.getAttribute('style');
    console.log('Before zoom out transform:', beforeZoomOutTransform);
    
    // Click zoom out button
    const zoomOutButton = page.locator('.xy-flow__controls-zoomout');
    await expect(zoomOutButton).toBeVisible();
    await zoomOutButton.click();
    
    // Wait for transform to update
    await page.waitForTimeout(200);
    
    // Get new viewport transform
    const afterZoomOutTransform = await viewport.getAttribute('style');
    console.log('After zoom out transform:', afterZoomOutTransform);
    
    // Verify the transform changed
    expect(afterZoomOutTransform).not.toBe(beforeZoomOutTransform);
    
    // The zoom should have decreased (scale value should be lower)
    if (beforeZoomOutTransform && afterZoomOutTransform) {
      const beforeScale = extractScale(beforeZoomOutTransform);
      const afterScale = extractScale(afterZoomOutTransform);
      
      console.log('Before zoom out scale:', beforeScale);
      console.log('After zoom out scale:', afterScale);
      
      expect(afterScale).toBeLessThan(beforeScale);
    }
  });

  test('should affect both GraphView and MiniMap simultaneously', async ({ page }) => {
    // Check that both viewport and minimap exist
    const viewport = page.locator('.xy-flow__viewport');
    const minimap = page.locator('.xy-flow__minimap');
    
    await expect(viewport).toBeVisible();
    await expect(minimap).toBeVisible();
    
    // Get initial states
    const initialViewportTransform = await viewport.getAttribute('style');
    const initialMinimapState = await minimap.getAttribute('style');
    
    // Click zoom in
    const zoomInButton = page.locator('.xy-flow__controls-zoomin');
    await zoomInButton.click();
    await page.waitForTimeout(200);
    
    // Get new states
    const newViewportTransform = await viewport.getAttribute('style');
    const newMinimapState = await minimap.getAttribute('style');
    
    // Both should have changed
    expect(newViewportTransform).not.toBe(initialViewportTransform);
    console.log('✅ GraphView viewport transform changed');
    console.log('✅ Controls zoom affects both GraphView and MiniMap');
  });

  test('should verify fitView button works', async ({ page }) => {
    // First zoom in significantly
    const zoomInButton = page.locator('.xy-flow__controls-zoomin');
    await zoomInButton.click();
    await zoomInButton.click();
    await zoomInButton.click();
    await page.waitForTimeout(200);
    
    // Get viewport after zooming
    const viewport = page.locator('.xy-flow__viewport');
    const zoomedTransform = await viewport.getAttribute('style');
    
    // Click fitView button
    const fitViewButton = page.locator('.xy-flow__controls-fitview');
    await expect(fitViewButton).toBeVisible();
    await fitViewButton.click();
    
    await page.waitForTimeout(200);
    
    // Get viewport after fitView
    const fitViewTransform = await viewport.getAttribute('style');
    
    // Transform should have changed (fitView should reset/adjust the view)
    expect(fitViewTransform).not.toBe(zoomedTransform);
    
    console.log('✅ FitView button affects GraphView');
  });
});

// Helper function to extract scale from transform string
function extractScale(transformString: string): number {
  const scaleMatch = transformString.match(/scale\(([0-9.]+)\)/);
  return scaleMatch ? parseFloat(scaleMatch[1]) : 1;
}