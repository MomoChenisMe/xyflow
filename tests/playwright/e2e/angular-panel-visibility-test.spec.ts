import { test, expect } from '@playwright/test';

test.describe('Angular Panel Visibility Fix', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Angular Flow Basic example
    await page.goto('http://localhost:4201');
  });

  test('should display panel buttons without clipping', async ({ page }) => {
    // Wait for the flow to be loaded
    await page.waitForSelector('angular-flow-basic');
    
    // Look for the panel component
    const panel = page.locator('xy-panel[position="top-right"]');
    await expect(panel).toBeVisible();
    
    // Check that all buttons are visible and not clipped
    const buttons = [
      'reset transform',
      'change pos', 
      'toggle classnames',
      'toObject',
      'deleteSelectedElements',
      'deleteSomeElements',
      'setNodes',
      'updateNode',
      'addNode'
    ];
    
    for (const buttonText of buttons) {
      const button = panel.locator(`button:has-text("${buttonText}")`);
      await expect(button).toBeVisible();
      
      // Check that the button is fully visible (not clipped)
      const buttonBox = await button.boundingBox();
      expect(buttonBox).toBeTruthy();
      
      // Ensure button is not at edge of viewport (not clipped)
      if (buttonBox) {
        expect(buttonBox.x).toBeGreaterThan(0);
        expect(buttonBox.y).toBeGreaterThan(0);
        expect(buttonBox.x + buttonBox.width).toBeLessThan(await page.viewport()?.width || 1200);
        expect(buttonBox.y + buttonBox.height).toBeLessThan(await page.viewport()?.height || 800);
      }
    }
  });

  test('should properly position panel in top-right corner', async ({ page }) => {
    await page.waitForSelector('angular-flow-basic');
    
    const panel = page.locator('xy-panel[position="top-right"]');
    await expect(panel).toBeVisible();
    
    // Check panel positioning
    const panelBox = await panel.boundingBox();
    const viewport = page.viewport();
    
    expect(panelBox).toBeTruthy();
    if (panelBox && viewport) {
      // Should be in top-right area of the viewport
      expect(panelBox.x).toBeGreaterThan(viewport.width * 0.6); // Right side
      expect(panelBox.y).toBeLessThan(viewport.height * 0.3);   // Top side
    }
  });

  test('should make panel buttons clickable without issues', async ({ page }) => {
    await page.waitForSelector('angular-flow-basic');
    
    const panel = page.locator('xy-panel[position="top-right"]');
    
    // Test clicking the "reset transform" button
    const resetButton = panel.locator('button:has-text("reset transform")');
    await expect(resetButton).toBeVisible();
    await resetButton.click();
    
    // Test clicking the "change pos" button  
    const changePosButton = panel.locator('button:has-text("change pos")');
    await expect(changePosButton).toBeVisible();
    await changePosButton.click();
    
    // Test clicking the "toggle classnames" button
    const toggleButton = panel.locator('button:has-text("toggle classnames")');
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();
    
    // No errors should occur and buttons should remain visible
    await expect(resetButton).toBeVisible();
    await expect(changePosButton).toBeVisible();
    await expect(toggleButton).toBeVisible();
  });

  test('should have proper CSS styling applied to panel', async ({ page }) => {
    await page.waitForSelector('angular-flow-basic');
    
    const panel = page.locator('xy-panel[position="top-right"]');
    const panelDiv = panel.locator('.react-flow__panel');
    
    await expect(panelDiv).toBeVisible();
    
    // Check that panel has proper CSS classes
    await expect(panelDiv).toHaveClass(/react-flow__panel/);
    await expect(panelDiv).toHaveClass(/top/);
    await expect(panelDiv).toHaveClass(/right/);
    
    // Check computed styles
    const position = await panelDiv.evaluate(el => getComputedStyle(el).position);
    expect(position).toBe('absolute');
    
    const zIndex = await panelDiv.evaluate(el => getComputedStyle(el).zIndex);
    expect(parseInt(zIndex)).toBeGreaterThanOrEqual(5);
  });

  test('should not have overflow issues with main container', async ({ page }) => {
    await page.waitForSelector('angular-flow-basic');
    
    const container = page.locator('.xy-flow-basic-example');
    await expect(container).toBeVisible();
    
    // Check container overflow properties
    const overflow = await container.evaluate(el => getComputedStyle(el).overflow);
    expect(overflow).toBe('hidden');
    
    const position = await container.evaluate(el => getComputedStyle(el).position);
    expect(position).toBe('relative');
    
    // Ensure the Angular Flow component is properly contained
    const angularFlow = page.locator('angular-flow-basic');
    const angularFlowBox = await angularFlow.boundingBox();
    const containerBox = await container.boundingBox();
    
    expect(angularFlowBox).toBeTruthy();
    expect(containerBox).toBeTruthy();
    
    if (angularFlowBox && containerBox) {
      // Angular flow should be within container bounds
      expect(angularFlowBox.x).toBeGreaterThanOrEqual(containerBox.x);
      expect(angularFlowBox.y).toBeGreaterThanOrEqual(containerBox.y);
      expect(angularFlowBox.x + angularFlowBox.width).toBeLessThanOrEqual(containerBox.x + containerBox.width);
      expect(angularFlowBox.y + angularFlowBox.height).toBeLessThanOrEqual(containerBox.y + containerBox.height);
    }
  });
});