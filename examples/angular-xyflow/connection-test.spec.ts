import { test, expect } from '@playwright/test';

test.describe('Angular Connection Line Test', () => {
  test('connection line appears during drag', async ({ page }) => {
    // Navigate to the Angular XYFlow app
    await page.goto('http://localhost:4200');
    
    // Wait for nodes to be visible
    await page.waitForSelector('[data-id="1"]', { timeout: 10000 });
    
    // Look for a handle on node 1 (source)
    const sourceHandle = page.locator('[data-handlepos="right"][data-nodeid="1"]').first();
    await expect(sourceHandle).toBeVisible();
    
    // Look for a handle on node 2 (target) 
    const targetHandle = page.locator('[data-handlepos="left"][data-nodeid="2"]').first();
    await expect(targetHandle).toBeVisible();
    
    console.log('Starting drag from source handle to target handle');
    
    // Start drag from source handle
    await sourceHandle.hover();
    await page.mouse.down();
    
    // Move towards target (should trigger connection line)
    await page.mouse.move(400, 200);
    
    // Check if connection line is visible during drag
    const connectionLine = page.locator('svg path[class*="react-flow__connection-path"]');
    await expect(connectionLine).toBeVisible();
    
    console.log('Connection line is visible');
    
    // Complete the drag to target handle
    await targetHandle.hover();
    await page.mouse.up();
    
    // Check if connection was created
    const edge = page.locator('svg path[data-testid="rf__edge-12"]');
    await expect(edge).toBeVisible();
    
    console.log('Connection created successfully');
  });
});