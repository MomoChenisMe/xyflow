import { test, expect } from '@playwright/test';

test.describe('Angular Flow Basic Tests', () => {
  test('should load the Angular Flow app', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForSelector('h1');
    
    // Check if the title is visible
    await expect(page.locator('h1')).toContainText('Angular XY Flow Demo');
    
    // Check if the angular-flow component is visible
    await expect(page.locator('angular-flow')).toBeVisible();
    
    // Check if the flow container is visible
    await expect(page.locator('.flow-container')).toBeVisible();
    
    console.log('✅ Angular Flow app loaded successfully!');
  });
  
  test('should render nodes', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the angular-flow component to load
    await page.waitForSelector('angular-flow');
    
    // Wait for nodes to be rendered
    await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
    
    // Check if we have the expected number of nodes
    const nodeCount = await page.locator('.xy-flow__node').count();
    expect(nodeCount).toBe(3);
    
    console.log('✅ Nodes rendered successfully!');
  });
  
  test('should render edges', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the angular-flow component to load
    await page.waitForSelector('angular-flow');
    
    // Wait for edges to be rendered
    await page.waitForSelector('.xy-flow__edge', { timeout: 10000 });
    
    // Check if we have the expected number of edges
    const edgeCount = await page.locator('.xy-flow__edge').count();
    expect(edgeCount).toBe(2);
    
    console.log('✅ Edges rendered successfully!');
  });
  
  test('should handle node clicks', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the angular-flow component to load
    await page.waitForSelector('angular-flow');
    
    // Wait for nodes to be rendered
    await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
    
    // Listen for console messages
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });
    
    // Click on the first node
    await page.locator('.xy-flow__node').first().click();
    
    // Wait for the console message
    await page.waitForTimeout(1000);
    
    // Check if the node click was handled
    const nodeClickMessages = consoleMessages.filter(msg => msg.includes('Node clicked'));
    expect(nodeClickMessages.length).toBeGreaterThan(0);
    
    console.log('✅ Node click handled successfully!');
  });
  
  test('should be able to drag nodes', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the angular-flow component to load
    await page.waitForSelector('angular-flow');
    
    // Wait for nodes to be rendered
    await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
    
    // Get the first node
    const firstNode = page.locator('.xy-flow__node').first();
    
    // Get initial position
    const initialBox = await firstNode.boundingBox();
    
    if (initialBox) {
      // Try to drag the node
      await firstNode.dragTo(page.locator('.xy-flow__viewport'), {
        targetPosition: { x: initialBox.x + 50, y: initialBox.y + 50 }
      });
      
      // Wait for drag to complete
      await page.waitForTimeout(500);
      
      // Check if node position changed
      const finalBox = await firstNode.boundingBox();
      
      if (finalBox) {
        // The node should have moved
        const moved = (finalBox.x !== initialBox.x) || (finalBox.y !== initialBox.y);
        expect(moved).toBe(true);
        
        console.log('✅ Node dragging works successfully!');
      }
    }
  });
});