import { test, expect } from '@playwright/test';

test.describe('Angular Flow Basic', () => {
  test.beforeEach(async ({ page }) => {
    // Go to our Angular Flow basic example
    await page.goto('http://localhost:4201/');
  });

  test('loads Angular Flow component successfully', async ({ page }) => {
    // Check if the Angular Flow component is rendered
    await expect(page.locator('angular-flow-basic')).toBeVisible();
    await expect(page.locator('.react-flow')).toBeVisible();
  });

  test('renders nodes correctly', async ({ page }) => {
    // Wait for nodes to be visible
    const nodes = page.locator('.xy-flow__node');
    await expect(nodes).toHaveCount(3); // Should have 3 initial nodes
    
    // Check if first node is visible
    await expect(nodes.first()).toBeVisible();
    
    // Check if nodes have correct labels
    await expect(page.locator('.xy-flow__node').first()).toContainText('1');
  });

  test('renders edges correctly', async ({ page }) => {
    // Check if edges are rendered
    const edges = page.locator('.xy-flow__edge');
    await expect(edges).toHaveCount(2); // Should have 2 initial edges
  });

  test('allows node selection', async ({ page }) => {
    // Click on first node
    const firstNode = page.locator('.xy-flow__node').first();
    await firstNode.click();
    
    // Check if node gets selected class
    await expect(firstNode).toHaveClass(/selected/);
  });

  test('control panel buttons work', async ({ page }) => {
    // Check if control panel is visible
    await expect(page.locator('.xy-flow__panel')).toBeVisible();
    
    // Check if buttons are present
    await expect(page.locator('button').filter({ hasText: 'reset transform' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'change pos' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'addNode' })).toBeVisible();
    
    // Test adding a node
    const initialNodeCount = await page.locator('.xy-flow__node').count();
    await page.locator('button').filter({ hasText: 'addNode' }).click();
    
    // Should have one more node
    await expect(page.locator('.xy-flow__node')).toHaveCount(initialNodeCount + 1);
  });

  test('supports drag and drop functionality', async ({ page }) => {
    // Get the first node
    const firstNode = page.locator('.xy-flow__node').first();
    await expect(firstNode).toBeVisible();
    
    // Get initial position
    const initialBox = await firstNode.boundingBox();
    expect(initialBox).toBeTruthy();
    
    // Drag the node to a new position
    await firstNode.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + 100, initialBox!.y + 100);
    await page.mouse.up();
    
    // Wait a bit for the drag to complete
    await page.waitForTimeout(100);
    
    // Check if position changed
    const newBox = await firstNode.boundingBox();
    expect(newBox).toBeTruthy();
    expect(newBox!.x).not.toEqual(initialBox!.x);
    expect(newBox!.y).not.toEqual(initialBox!.y);
  });

  test('supports viewport pan functionality', async ({ page }) => {
    // Get viewport container
    const viewport = page.locator('.xy-flow__viewport');
    await expect(viewport).toBeVisible();
    
    // Get initial viewport transform
    const initialTransform = await viewport.getAttribute('style');
    
    // Pan the viewport by dragging on the pane
    const pane = page.locator('.xy-flow__pane');
    await expect(pane).toBeVisible();
    
    const paneBox = await pane.boundingBox();
    expect(paneBox).toBeTruthy();
    
    // Drag on empty area to pan
    await page.mouse.move(paneBox!.x + 200, paneBox!.y + 200);
    await page.mouse.down();
    await page.mouse.move(paneBox!.x + 300, paneBox!.y + 300);
    await page.mouse.up();
    
    // Wait for pan to complete
    await page.waitForTimeout(100);
    
    // Check if viewport transform changed
    const newTransform = await viewport.getAttribute('style');
    expect(newTransform).not.toEqual(initialTransform);
  });
});