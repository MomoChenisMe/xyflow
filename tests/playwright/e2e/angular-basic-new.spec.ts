import { test, expect } from '@playwright/test';

test.describe('Angular Flow Basic Example', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Angular Flow basic example
    await page.goto('http://localhost:4200');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should render the angular flow container', async ({ page }) => {
    // Check if the main angular flow container is present
    const flowContainer = page.locator('.angular-flow');
    await expect(flowContainer).toBeVisible();
    
    // Check if the basic example container is present
    const basicExampleContainer = page.locator('.basic-example-container');
    await expect(basicExampleContainer).toBeVisible();
  });

  test('should render default nodes and edges', async ({ page }) => {
    // Wait for nodes to be rendered
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // Check that 4 nodes are present (as defined in initialNodes)
    const nodes = page.locator('.angular-flow__node');
    await expect(nodes).toHaveCount(4);
    
    // Check that nodes have correct labels
    await expect(page.locator('.angular-flow__node').nth(0)).toContainText('Node 1');
    await expect(page.locator('.angular-flow__node').nth(1)).toContainText('Node 2');
    await expect(page.locator('.angular-flow__node').nth(2)).toContainText('Node 3');
    await expect(page.locator('.angular-flow__node').nth(3)).toContainText('Node 4');
    
    // Check that edges are rendered
    const edges = page.locator('.angular-flow__edge');
    await expect(edges).toHaveCount(2);
  });

  test('should render background pattern', async ({ page }) => {
    // Check if background SVG is present
    const background = page.locator('.angular-flow__background');
    await expect(background).toBeVisible();
    
    // Check if dots pattern is present
    const dotsPattern = page.locator('[id="angular-flow-background-dots"]');
    await expect(dotsPattern).toBeVisible();
  });

  test('should render controls component', async ({ page }) => {
    // Check if controls are present
    const controls = page.locator('.angular-flow__controls');
    await expect(controls).toBeVisible();
    
    // Check for specific control buttons
    const zoomInButton = page.locator('.angular-flow__controls-zoomin');
    const zoomOutButton = page.locator('.angular-flow__controls-zoomout');
    const fitViewButton = page.locator('.angular-flow__controls-fitview');
    
    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();
    await expect(fitViewButton).toBeVisible();
  });

  test('should render minimap component', async ({ page }) => {
    // Check if minimap is present
    const minimap = page.locator('.angular-flow__minimap');
    await expect(minimap).toBeVisible();
    
    // Check if minimap SVG is present
    const minimapSvg = page.locator('.angular-flow__minimap-svg');
    await expect(minimapSvg).toBeVisible();
  });

  test('should render panel with buttons', async ({ page }) => {
    // Check if panel is present
    const panel = page.locator('angular-flow-panel');
    await expect(panel).toBeVisible();
    
    // Check for panel buttons
    const resetButton = page.locator('button:has-text("reset transform")');
    const changePosButton = page.locator('button:has-text("change pos")');
    const toggleClassnamesButton = page.locator('button:has-text("toggle classnames")');
    const toObjectButton = page.locator('button:has-text("toObject")');
    const addNodeButton = page.locator('button:has-text("addNode")');
    
    await expect(resetButton).toBeVisible();
    await expect(changePosButton).toBeVisible();
    await expect(toggleClassnamesButton).toBeVisible();
    await expect(toObjectButton).toBeVisible();
    await expect(addNodeButton).toBeVisible();
  });

  test('should interact with zoom controls', async ({ page }) => {
    // Get initial viewport state by checking transform
    const viewport = page.locator('.angular-flow__viewport');
    const initialTransform = await viewport.getAttribute('style');
    
    // Click zoom in button
    const zoomInButton = page.locator('.angular-flow__controls-zoomin');
    await zoomInButton.click();
    
    // Wait for transform change
    await page.waitForTimeout(100);
    
    // Check that transform has changed (zoom should increase)
    const newTransform = await viewport.getAttribute('style');
    expect(newTransform).not.toBe(initialTransform);
  });

  test('should interact with panel buttons', async ({ page }) => {
    // Test adding a new node
    const addNodeButton = page.locator('button:has-text("addNode")');
    await addNodeButton.click();
    
    // Wait for potential node addition
    await page.waitForTimeout(200);
    
    // Test changing positions
    const changePosButton = page.locator('button:has-text("change pos")');
    await changePosButton.click();
    
    // Wait for position change animation/update
    await page.waitForTimeout(200);
    
    // Test toggle classnames
    const toggleClassnamesButton = page.locator('button:has-text("toggle classnames")');
    await toggleClassnamesButton.click();
    
    // Wait for class changes
    await page.waitForTimeout(200);
  });

  test('should handle node interactions', async ({ page }) => {
    // Wait for nodes to be rendered
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // Get first node
    const firstNode = page.locator('.angular-flow__node').first();
    await expect(firstNode).toBeVisible();
    
    // Test node click (should log to console)
    await firstNode.click();
    
    // Test hover effect
    await firstNode.hover();
    
    // Wait a bit for any hover effects
    await page.waitForTimeout(100);
  });

  test('should render node handles', async ({ page }) => {
    // Wait for nodes to be rendered
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // Check for handles on nodes
    const handles = page.locator('.angular-flow__handle');
    
    // Should have handles (source and target for each node)
    const handleCount = await handles.count();
    expect(handleCount).toBeGreaterThan(0);
  });

  test('should have proper CSS classes and styling', async ({ page }) => {
    // Check main container classes
    const flowContainer = page.locator('.angular-flow');
    await expect(flowContainer).toHaveClass(/react-flow-basic-example/);
    
    // Check node type classes
    const inputNode = page.locator('.angular-flow__node.type-input');
    await expect(inputNode).toBeVisible();
    
    // Check light theme classes
    const lightNodes = page.locator('.angular-flow__node.light');
    await expect(lightNodes).toHaveCount(4);
  });

  test('should be responsive and properly sized', async ({ page }) => {
    // Check that the container takes full viewport
    const container = page.locator('.basic-example-container');
    const boundingBox = await container.boundingBox();
    
    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      expect(boundingBox.width).toBeGreaterThan(800);
      expect(boundingBox.height).toBeGreaterThan(600);
    }
  });
});