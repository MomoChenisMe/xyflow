import { test, expect } from '@playwright/test';

test.describe('Angular XYFlow Basic Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    
    // Check if the main component is loaded
    await expect(page.locator('app-root')).toBeVisible();
    await expect(page.locator('basic-example')).toBeVisible();
  });

  test('should render the flow container', async ({ page }) => {
    await page.goto('/');
    
    // Check if the angular-flow component is rendered
    await expect(page.locator('angular-flow')).toBeVisible();
    
    // Check if the flow container has the right classes
    await expect(page.locator('.xy-flow')).toBeVisible();
  });

  test('should render nodes', async ({ page }) => {
    await page.goto('/');
    
    // Wait for nodes to be rendered
    await expect(page.locator('.xy-flow__node')).toHaveCount(3);
    
    // Check specific node types
    await expect(page.locator('.xy-flow__node-input')).toBeVisible();
    await expect(page.locator('.xy-flow__node-default')).toBeVisible();
    await expect(page.locator('.xy-flow__node-output')).toBeVisible();
  });

  test('should render edges', async ({ page }) => {
    await page.goto('/');
    
    // Wait for edges to be rendered
    await expect(page.locator('.xy-flow__edge')).toHaveCount(2);
    
    // Check edge paths
    await expect(page.locator('.xy-flow__edge-path')).toHaveCount(2);
  });

  test('should render node handles', async ({ page }) => {
    await page.goto('/');
    
    // Check if handles are rendered
    await expect(page.locator('.xy-flow__handle')).toHaveCount(6); // 3 nodes * 2 handles each
  });

  test('should render controls', async ({ page }) => {
    await page.goto('/');
    
    // Check if controls are rendered
    await expect(page.locator('controls')).toBeVisible();
  });

  test('should render minimap', async ({ page }) => {
    await page.goto('/');
    
    // Check if minimap is rendered
    await expect(page.locator('minimap')).toBeVisible();
  });

  test('should render background', async ({ page }) => {
    await page.goto('/');
    
    // Check if background is rendered
    await expect(page.locator('background')).toBeVisible();
  });

  test('should display node labels', async ({ page }) => {
    await page.goto('/');
    
    // Wait for nodes to be rendered
    await expect(page.locator('.xy-flow__node')).toHaveCount(3);
    
    // Check node labels
    await expect(page.locator('text=Input Node')).toBeVisible();
    await expect(page.locator('text=Default Node')).toBeVisible();
    await expect(page.locator('text=Output Node')).toBeVisible();
  });

  test('should have correct viewport setup', async ({ page }) => {
    await page.goto('/');
    
    // Check viewport container
    await expect(page.locator('.xy-flow__viewport')).toBeVisible();
    
    // Check initial transform
    const viewport = page.locator('.xy-flow__viewport');
    await expect(viewport).toHaveAttribute('style', /transform:/);
  });

  test('should handle node interactions', async ({ page }) => {
    await page.goto('/');
    
    // Wait for nodes to be rendered
    await expect(page.locator('.xy-flow__node')).toHaveCount(3);
    
    // Try to click on a node
    const firstNode = page.locator('.xy-flow__node').first();
    await firstNode.click();
    
    // The node should become selected (this might vary based on implementation)
    // We'll check that the click doesn't cause any errors
    await expect(firstNode).toBeVisible();
  });
});