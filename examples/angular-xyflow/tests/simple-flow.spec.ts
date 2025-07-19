import { test, expect } from '@playwright/test';

test.describe('Simple Angular Flow Tests', () => {
  test('should load the simple Angular Flow app', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForSelector('h1');
    
    // Check if the title is visible
    await expect(page.locator('h1')).toContainText('Angular XY Flow - Simple Test');
    
    // Check if the angular-flow-simple component is visible
    await expect(page.locator('angular-flow-simple')).toBeVisible();
    
    // Check if the xy-flow container is visible
    await expect(page.locator('.xy-flow')).toBeVisible();
    
    // Check if the debug info is visible
    await expect(page.locator('.debug-info')).toBeVisible();
    
    // Check if the debug info shows correct node count
    await expect(page.locator('.debug-info')).toContainText('Nodes: 2');
    
    // Check if the debug info shows correct edge count
    await expect(page.locator('.debug-info')).toContainText('Edges: 1');
    
    console.log('✅ Simple Angular Flow app loaded successfully!');
  });
  
  test('should render nodes with correct content', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the simple flow component to load
    await page.waitForSelector('angular-flow-simple');
    
    // Check if nodes are rendered
    await expect(page.locator('.xy-flow__node')).toHaveCount(2);
    
    // Check if nodes have correct content
    await expect(page.locator('.xy-flow__node').first()).toContainText('Node 1');
    await expect(page.locator('.xy-flow__node').last()).toContainText('Node 2');
    
    console.log('✅ Nodes rendered with correct content!');
  });
  
  test('should render edges', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the simple flow component to load
    await page.waitForSelector('angular-flow-simple');
    
    // Check if edges are rendered
    await expect(page.locator('.xy-flow__edge')).toHaveCount(1);
    
    console.log('✅ Edges rendered successfully!');
  });
});