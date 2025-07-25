import { test, expect } from '@playwright/test';

test.describe('Angular XYFlow Simple Basic Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Angular application
    await page.goto('http://localhost:4200');
  });

  test('should display the simple basic example', async ({ page }) => {
    // Check if the main container loads
    await expect(page.locator('.simple-flow-container')).toBeVisible();
    
    // Check if the title is present
    await expect(page.locator('h1')).toContainText('Angular XYFlow - Simple Basic Example');
    
    // Check if description is present
    await expect(page.locator('p')).toContainText('This is a simplified basic example showing basic functionality');
  });

  test('should render initial nodes', async ({ page }) => {
    // Wait for nodes to be rendered
    await page.waitForSelector('.simple-node');
    
    // Check that we have the expected number of initial nodes
    const nodes = page.locator('.simple-node');
    await expect(nodes).toHaveCount(3);
    
    // Check node labels
    await expect(nodes.nth(0)).toContainText('Node 1');
    await expect(nodes.nth(1)).toContainText('Node 2');
    await expect(nodes.nth(2)).toContainText('Node 3');
  });

  test('should render initial edges', async ({ page }) => {
    // Wait for SVG and edges to be rendered
    await page.waitForSelector('.simple-flow svg');
    
    // Check that we have SVG lines representing edges
    const edges = page.locator('.simple-flow svg line');
    await expect(edges).toHaveCount(2);
  });

  test('should have working control buttons', async ({ page }) => {
    // Check if control buttons are present
    await expect(page.locator('button', { hasText: 'Add Node' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Reset Nodes' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Log Data' })).toBeVisible();
  });

  test('should add new node when Add Node button is clicked', async ({ page }) => {
    // Count initial nodes
    const initialNodes = page.locator('.simple-node');
    await expect(initialNodes).toHaveCount(3);
    
    // Click Add Node button
    await page.click('button:has-text("Add Node")');
    
    // Check that a new node was added
    const nodesAfterAdd = page.locator('.simple-node');
    await expect(nodesAfterAdd).toHaveCount(4);
  });

  test('should reset nodes when Reset Nodes button is clicked', async ({ page }) => {
    // Add a new node first
    await page.click('button:has-text("Add Node")');
    
    // Verify we have 4 nodes
    await expect(page.locator('.simple-node')).toHaveCount(4);
    
    // Click Reset Nodes button
    await page.click('button:has-text("Reset Nodes")');
    
    // Check that we're back to 3 nodes
    await expect(page.locator('.simple-node')).toHaveCount(3);
  });

  test('should select nodes when clicked', async ({ page }) => {
    // Wait for nodes to be rendered
    await page.waitForSelector('.simple-node');
    
    // Click on the first node
    await page.click('.simple-node:first-child');
    
    // Check that the node has the selected class
    await expect(page.locator('.simple-node:first-child')).toHaveClass(/selected/);
  });

  test('should display current state', async ({ page }) => {
    // Check if data display section is present
    await expect(page.locator('.data-display')).toBeVisible();
    await expect(page.locator('.data-display h3')).toContainText('Current State:');
    
    // Check if state data is displayed
    await expect(page.locator('.data-display pre')).toBeVisible();
    
    // Verify initial state shows 3 nodes and 2 edges
    const stateText = await page.locator('.data-display pre').textContent();
    expect(stateText).toContain('"nodes": 3');
    expect(stateText).toContain('"edges": 2');
  });

  test('should update state when nodes are added', async ({ page }) => {
    // Add a node
    await page.click('button:has-text("Add Node")');
    
    // Check that state display is updated
    const stateText = await page.locator('.data-display pre').textContent();
    expect(stateText).toContain('"nodes": 4');
  });

  test('should update state when node is selected', async ({ page }) => {
    // Click on a node to select it
    await page.click('.simple-node:first-child');
    
    // Check that selected count is updated
    const stateText = await page.locator('.data-display pre').textContent();
    expect(stateText).toContain('"selected": 1');
  });

  test('should have proper styling', async ({ page }) => {
    // Check if nodes have proper styling
    const firstNode = page.locator('.simple-node').first();
    
    // Check that node has background color
    const backgroundColor = await firstNode.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).toBeTruthy();
    
    // Check that node has border
    const border = await firstNode.evaluate(el => 
      window.getComputedStyle(el).border
    );
    expect(border).toContain('1px');
  });

  test('should have responsive layout', async ({ page }) => {
    // Check if the flow container takes full width
    const container = page.locator('.simple-flow');
    const width = await container.evaluate(el => el.offsetWidth);
    expect(width).toBeGreaterThan(0);
    
    // Check if it has the expected height
    const height = await container.evaluate(el => el.offsetHeight);
    expect(height).toBe(400); // Based on our CSS
  });
});

test.describe('Angular XYFlow Simple Basic Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForSelector('.simple-node');
  });

  test('should support basic drag functionality', async ({ page }) => {
    // Get initial position of first node
    const firstNode = page.locator('.simple-node').first();
    const initialBox = await firstNode.boundingBox();
    
    if (!initialBox) {
      throw new Error('Node not found');
    }
    
    // Perform drag operation
    await page.mouse.move(initialBox.x + initialBox.width / 2, initialBox.y + initialBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(initialBox.x + 100, initialBox.y + 50);
    await page.mouse.up();
    
    // Get final position
    const finalBox = await firstNode.boundingBox();
    
    if (!finalBox) {
      throw new Error('Node not found after drag');
    }
    
    // Check that position changed
    expect(finalBox.x).not.toBe(initialBox.x);
    expect(finalBox.y).not.toBe(initialBox.y);
  });

  test('should maintain edge connections when nodes are moved', async ({ page }) => {
    // Check initial edge count
    const edges = page.locator('.simple-flow svg line');
    await expect(edges).toHaveCount(2);
    
    // Move a node
    const firstNode = page.locator('.simple-node').first();
    const box = await firstNode.boundingBox();
    
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.up();
    }
    
    // Check that edges are still present
    await expect(edges).toHaveCount(2);
  });
});