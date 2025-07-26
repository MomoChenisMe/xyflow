import { test, expect } from '@playwright/test';

test.describe('Angular Flow Basic Example', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to our Angular Flow basic example
    await page.goto('http://localhost:4200/');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('loads Angular app successfully', async ({ page }) => {
    // Check if the main app component is rendered
    await expect(page.locator('app-root')).toBeVisible();
    await expect(page.locator('angular-flow')).toBeVisible();
  });

  test('renders Angular Flow component with correct CSS classes', async ({ page }) => {
    // Check if the Angular Flow component is rendered
    await expect(page.locator('angular-flow')).toBeVisible();
    
    // Check if the flow container exists with correct class
    await expect(page.locator('.angular-flow')).toBeVisible();
    
    // Check for basic example container
    await expect(page.locator('.basic-example-container')).toBeVisible();
  });

  test('renders initial nodes correctly', async ({ page }) => {
    // Wait for nodes to be visible
    const nodes = page.locator('.angular-flow__node');
    await expect(nodes).toHaveCount(4); // We have 4 initial nodes
    
    // Check if first node is visible
    await expect(nodes.first()).toBeVisible();
    
    // Check if nodes have correct content
    await expect(page.locator('.angular-flow__node').first()).toContainText('Node 1');
    await expect(page.locator('.angular-flow__node').nth(1)).toContainText('Node 2');
    await expect(page.locator('.angular-flow__node').nth(2)).toContainText('Node 3');
    await expect(page.locator('.angular-flow__node').nth(3)).toContainText('Node 4');
    
    // Check node types
    await expect(page.locator('.angular-flow__node.type-input')).toHaveCount(1);
    
    // Check light theme classes
    await expect(page.locator('.angular-flow__node.light')).toHaveCount(4);
  });

  test('renders edges correctly', async ({ page }) => {
    // Check if edges are rendered in the SVG
    const edges = page.locator('.angular-flow__edge');
    await expect(edges).toHaveCount(2); // We have 2 initial edges
    
    // Check if edge paths exist
    const edgePaths = page.locator('.angular-flow__edge-path');
    await expect(edgePaths).toHaveCount(2);
  });

  test('renders background component', async ({ page }) => {
    // Check if background component exists
    await expect(page.locator('angular-flow-background')).toBeVisible();
    
    // Check if background SVG is rendered and visible
    await expect(page.locator('.angular-flow__background')).toBeVisible();
    
    // Check for dots pattern
    await expect(page.locator('[id="angular-flow-background-dots"]')).toBeVisible();
  });

  test('renders minimap component', async ({ page }) => {
    // Check if minimap component exists
    await expect(page.locator('angular-flow-minimap')).toBeVisible();
    
    // Check if minimap inner element is rendered
    await expect(page.locator('.angular-flow__minimap')).toBeVisible();
    
    // Check if minimap SVG is present
    await expect(page.locator('.angular-flow__minimap-svg')).toBeVisible();
  });

  test('renders controls component', async ({ page }) => {
    // Check if controls component exists
    await expect(page.locator('angular-flow-controls')).toBeVisible();
    
    // Check if controls inner element is rendered
    await expect(page.locator('.angular-flow__controls')).toBeVisible();
    
    // Check if control buttons are present (zoom in, zoom out, fit view)
    await expect(page.locator('.angular-flow__controls-zoomin')).toBeVisible();
    await expect(page.locator('.angular-flow__controls-zoomout')).toBeVisible();
    await expect(page.locator('.angular-flow__controls-fitview')).toBeVisible();
  });

  test('renders panel with buttons', async ({ page }) => {
    // Check if the panel component exists
    await expect(page.locator('angular-flow-panel')).toBeVisible();
    
    // Check if panel buttons are present
    await expect(page.locator('button').filter({ hasText: 'reset transform' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'change pos' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'toggle classnames' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'addNode' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'toObject' })).toBeVisible();
  });

  test('addNode button functionality', async ({ page }) => {
    // Get initial node count
    const initialNodeCount = await page.locator('.angular-flow__node').count();
    
    // Click add node button
    await page.locator('button').filter({ hasText: 'addNode' }).click();
    
    // Wait a bit for the node to be added
    await page.waitForTimeout(500);
    
    // Should have one more node
    await expect(page.locator('.angular-flow__node')).toHaveCount(initialNodeCount + 1);
  });

  test('toggle classnames button functionality', async ({ page }) => {
    // Get first node
    const firstNode = page.locator('.angular-flow__node').first();
    
    // Check initial class (should be 'light')
    await expect(firstNode).toHaveClass(/light/);
    
    // Click toggle classnames button
    await page.locator('button').filter({ hasText: 'toggle classnames' }).click();
    
    // Wait for update
    await page.waitForTimeout(500);
    
    // Should now have 'dark' class
    await expect(firstNode).toHaveClass(/dark/);
  });

  test('zoom controls functionality', async ({ page }) => {
    // Get initial viewport transform
    const viewport = page.locator('.angular-flow__viewport');
    const initialTransform = await viewport.getAttribute('style');
    
    // Click zoom in button
    await page.locator('.angular-flow__controls-zoomin').click();
    await page.waitForTimeout(200);
    
    // Transform should have changed
    const newTransform = await viewport.getAttribute('style');
    expect(newTransform).not.toBe(initialTransform);
  });

  test('panel button interactions', async ({ page }) => {
    // Test reset transform button
    await page.locator('button').filter({ hasText: 'reset transform' }).click();
    await page.waitForTimeout(200);
    
    // Test change pos button
    await page.locator('button').filter({ hasText: 'change pos' }).click();
    await page.waitForTimeout(200);
    
    // Test toObject button (should log to console)
    await page.locator('button').filter({ hasText: 'toObject' }).click();
    await page.waitForTimeout(200);
  });

  test('node handles are rendered', async ({ page }) => {
    // Wait for nodes to be rendered
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // Check for handles on nodes
    const handles = page.locator('.angular-flow__handle');
    
    // Should have handles (source and target for each node)
    const handleCount = await handles.count();
    expect(handleCount).toBeGreaterThan(0);
  });

  test('application is responsive', async ({ page }) => {
    // Check that the container takes appropriate space
    const container = page.locator('.basic-example-container');
    const boundingBox = await container.boundingBox();
    
    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      expect(boundingBox.width).toBeGreaterThan(300);
      expect(boundingBox.height).toBeGreaterThan(200);
    }
  });
});