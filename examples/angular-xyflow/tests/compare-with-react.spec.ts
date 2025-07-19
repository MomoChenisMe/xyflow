import { test, expect } from '@playwright/test';

test.describe('Compare Angular XYFlow with React Flow', () => {
  test('should display flow diagram with nodes and edges', async ({ page }) => {
    await page.goto('/');
    
    // Check if the app loads
    await expect(page.locator('app-root')).toBeVisible();
    
    // Check if the flow component loads
    await expect(page.locator('simple-flow')).toBeVisible();
    
    // Check if nodes are visible
    await expect(page.locator('.node')).toHaveCount(2);
    await expect(page.locator('.node').nth(0)).toHaveText('Node 1');
    await expect(page.locator('.node').nth(1)).toHaveText('Node 2');
    
    // Check if edge (SVG path) is visible
    await expect(page.locator('svg path')).toBeVisible();
    
    // Check if node count is displayed
    await expect(page.locator('text=Node count: 2')).toBeVisible();
    
    // Take a screenshot for comparison
    await page.screenshot({ path: 'angular-flow-screenshot.png' });
  });

  test('should have interactive elements', async ({ page }) => {
    await page.goto('/');
    
    // Check if nodes are interactive (hover effect)
    const firstNode = page.locator('.node').first();
    await firstNode.hover();
    
    // Node should be clickable
    await firstNode.click();
    
    // No errors should occur
    await expect(firstNode).toBeVisible();
  });

  test('should match basic React Flow functionality', async ({ page }) => {
    await page.goto('/');
    
    // Basic elements that should match React Flow:
    // 1. Container with flow content
    await expect(page.locator('.flow-container')).toBeVisible();
    
    // 2. Multiple nodes positioned absolutely
    const nodes = page.locator('.node');
    await expect(nodes).toHaveCount(2);
    
    // 3. SVG for rendering connections
    await expect(page.locator('svg')).toBeVisible();
    
    // 4. Proper positioning of nodes
    const node1 = page.locator('.node').nth(0);
    const node2 = page.locator('.node').nth(1);
    
    // Check that nodes have different positions
    const node1Box = await node1.boundingBox();
    const node2Box = await node2.boundingBox();
    
    expect(node1Box?.x).not.toBe(node2Box?.x);
    expect(node1Box?.y).not.toBe(node2Box?.y);
  });
});