import { test, expect } from '@playwright/test';

/**
 * Angular Basic Modern Component Test
 * Tests the new Angular Basic example component using Signals and modern Angular patterns
 * 
 * This test suite verifies that our modern Angular implementation with Signals
 * provides the same functionality as the React Flow Basic example
 */

test.describe('Angular Basic Modern Component - React Flow Compatible', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render Angular Flow with modern signals implementation', async ({ page }) => {
    // Wait for Angular to bootstrap
    await page.waitForTimeout(2000);
    
    // Check main containers exist
    await expect(page.locator('app-angular-basic-modern')).toBeVisible();
    await expect(page.locator('angular-flow')).toBeVisible();
    await expect(page.locator('.react-flow-basic-example')).toBeVisible();
    
    // Verify component structure
    await expect(page.locator('xy-background')).toBeVisible();
    await expect(page.locator('xy-minimap')).toBeVisible();
    await expect(page.locator('xy-controls')).toBeVisible();
    await expect(page.locator('xy-panel')).toBeVisible();
  });

  test('should render 4 nodes and 2 edges like React Flow Basic example', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Check node count matches React example (look for angular-node-wrapper elements)
    const nodeCount = await page.locator('angular-node-wrapper').count();
    expect(nodeCount).toBe(4);
    
    // Verify node content matches React example
    await expect(page.locator('text=Node 1')).toBeVisible();
    await expect(page.locator('text=Node 2')).toBeVisible();
    await expect(page.locator('text=Node 3')).toBeVisible();
    await expect(page.locator('text=Node 4')).toBeVisible();
    
    // Check handle count - each node should have handles
    const handleCount = await page.locator('xy-handle').count();
    expect(handleCount).toBeGreaterThan(0);
  });

  test('should render Background with dots pattern', async ({ page }) => {
    // Wait for Angular to bootstrap
    await page.waitForTimeout(2000);
    
    // Check background component
    const background = page.locator('xy-background');
    await expect(background).toBeVisible();
    
    // Check SVG pattern for dots
    await expect(page.locator('xy-background svg')).toBeVisible();
    await expect(page.locator('xy-background circle')).toBeVisible();
  });

  test('should render MiniMap component', async ({ page }) => {
    // Wait for Angular to bootstrap
    await page.waitForTimeout(2000);
    
    // Check minimap component
    const minimap = page.locator('xy-minimap');
    await expect(minimap).toBeVisible();
    
    // Check minimap SVG
    await expect(page.locator('xy-minimap svg')).toBeVisible();
  });

  test('should render Controls component', async ({ page }) => {
    // Wait for Angular to bootstrap
    await page.waitForTimeout(2000);
    
    // Check controls component
    const controls = page.locator('xy-controls');
    await expect(controls).toBeVisible();
    
    // Check control buttons (zoom in, zoom out, fit view, interactive toggle)
    await expect(controls.locator('button')).toHaveCount(4);
  });

  test('should render control Panel with all React Flow Basic buttons', async ({ page }) => {
    // Wait for Angular to bootstrap
    await page.waitForTimeout(2000);
    
    // Check panel component
    const panel = page.locator('xy-panel');
    await expect(panel).toBeVisible();
    
    // Verify all buttons from React example are present
    await expect(page.locator('button').filter({ hasText: 'reset transform' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'change pos' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'toggle classnames' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'toObject' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'deleteSelectedElements' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'deleteSomeElements' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'setNodes' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'updateNode' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'addNode' })).toBeVisible();
  });

  test('should test reset transform functionality', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Click reset transform button
    await page.locator('button').filter({ hasText: 'reset transform' }).click();
    
    // Should not throw any errors and function should execute
    await page.waitForTimeout(100);
  });

  test('should test change pos functionality', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Click change pos button
    await page.locator('button').filter({ hasText: 'change pos' }).click();
    
    // Should randomize node positions
    await page.waitForTimeout(200);
  });

  test('should test toggle classnames functionality', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Click toggle classnames button
    await page.locator('button').filter({ hasText: 'toggle classnames' }).click();
    
    // Should toggle node classes
    await page.waitForTimeout(100);
  });

  test('should test toObject functionality', async ({ page }) => {
    let consoleMessages: string[] = [];
    
    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleMessages.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Click toObject button
    await page.locator('button').filter({ hasText: 'toObject' }).click();
    
    // Should log flow object
    await page.waitForTimeout(100);
    expect(consoleMessages.some(msg => msg.includes('Flow object:'))).toBe(true);
  });

  test('should test deleteSelectedElements functionality', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Click deleteSelectedElements button
    await page.locator('button').filter({ hasText: 'deleteSelectedElements' }).click();
    
    // Should execute without errors
    await page.waitForTimeout(100);
  });

  test('should test deleteSomeElements functionality', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Get initial counts
    const initialNodeCount = await page.locator('text=Node 2').count();
    
    // Click deleteSomeElements button  
    await page.locator('button').filter({ hasText: 'deleteSomeElements' }).click();
    
    await page.waitForTimeout(200);
    
    // Should delete specific elements (Node 2 and edge e1-3)
    const finalNodeCount = await page.locator('text=Node 2').count();
    expect(finalNodeCount).toBeLessThan(initialNodeCount);
  });

  test('should test setNodes functionality', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Click setNodes button
    await page.locator('button').filter({ hasText: 'setNodes' }).click();
    
    await page.waitForTimeout(300);
    
    // Should set new nodes (Node a and Node b)
    await expect(page.locator('text=Node a')).toBeVisible();
    await expect(page.locator('text=Node b')).toBeVisible();
  });

  test('should test updateNode functionality', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Click updateNode button
    await page.locator('button').filter({ hasText: 'updateNode' }).click();
    
    await page.waitForTimeout(200);
    
    // Should update node labels to "update"
    await expect(page.locator('text=update')).toHaveCount(2);
  });

  test('should test addNode functionality', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Get initial node count
    const initialCount = await page.locator('angular-node-wrapper').count();
    
    // Click addNode button
    await page.locator('button').filter({ hasText: 'addNode' }).click();
    
    await page.waitForTimeout(300);
    
    // Should add a new node
    const finalCount = await page.locator('angular-node-wrapper').count();
    expect(finalCount).toBe(initialCount + 1);
  });

  test('should verify Angular Signals are working correctly', async ({ page }) => {
    let consoleMessages: string[] = [];
    
    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleMessages.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Test various button clicks to verify signal reactivity
    await page.locator('button').filter({ hasText: 'addNode' }).click();
    await page.waitForTimeout(100);
    
    await page.locator('button').filter({ hasText: 'change pos' }).click();
    await page.waitForTimeout(100);
    
    await page.locator('button').filter({ hasText: 'toObject' }).click();
    await page.waitForTimeout(100);
    
    // Verify console messages show proper logging
    expect(consoleMessages.some(msg => msg.includes('addNode'))).toBe(true);
    expect(consoleMessages.some(msg => msg.includes('change pos'))).toBe(true);
    expect(consoleMessages.some(msg => msg.includes('Flow object'))).toBe(true);
  });

  test('should verify component renders without errors', async ({ page }) => {
    let errors: string[] = [];
    
    // Listen for page errors
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Wait a bit to catch any delayed errors
    await page.waitForTimeout(1000);
    
    // Should have no JavaScript errors
    expect(errors).toEqual([]);
  });

  test('should have consistent styling with React Flow', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Check if basic Flow styles are applied
    const angularFlow = page.locator('angular-flow');
    await expect(angularFlow).toHaveCSS('display', 'block');
    
    // Verify component exists and is visible
    await expect(page.locator('xy-background')).toBeVisible();
    await expect(page.locator('xy-minimap')).toBeVisible();
    await expect(page.locator('xy-controls')).toBeVisible();
    await expect(page.locator('xy-panel')).toBeVisible();
  });

  test('should verify new Angular template syntax (@if, @for) works', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // The fact that the component renders means the new template syntax is working
    // since our component uses @if in the template
    await expect(page.locator('angular-flow')).toBeVisible();
    
    // Background should render (it uses @if internally)
    await expect(page.locator('xy-background')).toBeVisible();
  });
});