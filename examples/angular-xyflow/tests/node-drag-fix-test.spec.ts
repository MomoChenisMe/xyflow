import { test, expect } from '@playwright/test';

test.describe('Node Dragging Fix Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4201');
    await page.waitForLoadState('networkidle');
    
    // Wait for nodes to be rendered
    await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
  });

  test('should be able to drag nodes and update their positions', async ({ page }) => {
    console.log('🧪 Starting node drag test...');
    
    // Get the first node
    const firstNode = page.locator('.xy-flow__node').first();
    await expect(firstNode).toBeVisible();
    
    // Get initial position
    const initialBounds = await firstNode.boundingBox();
    expect(initialBounds).not.toBeNull();
    
    console.log('📍 Initial node position:', initialBounds);
    
    // Perform drag operation
    console.log('🖱️ Starting drag operation...');
    await firstNode.hover();
    await page.mouse.down();
    
    // Drag by 100px right and 50px down
    await page.mouse.move(initialBounds!.x + 100, initialBounds!.y + 50);
    await page.mouse.up();
    
    // Wait a bit for the position to update
    await page.waitForTimeout(1000);
    
    // Get new position
    const newBounds = await firstNode.boundingBox();
    expect(newBounds).not.toBeNull();
    
    console.log('📍 New node position:', newBounds);
    
    // Verify the node has moved
    const moved = Math.abs(newBounds!.x - initialBounds!.x) > 50 || 
                  Math.abs(newBounds!.y - initialBounds!.y) > 25;
    
    expect(moved).toBe(true);
    console.log('✅ Node drag test passed - node position updated successfully!');
  });

  test('should handle multiple node drags', async ({ page }) => {
    console.log('🧪 Testing multiple node drags...');
    
    const nodes = page.locator('.xy-flow__node');
    const nodeCount = await nodes.count();
    
    console.log(`Found ${nodeCount} nodes`);
    expect(nodeCount).toBeGreaterThan(1);
    
    // Test dragging the second node
    const secondNode = nodes.nth(1);
    await expect(secondNode).toBeVisible();
    
    const initialBounds = await secondNode.boundingBox();
    expect(initialBounds).not.toBeNull();
    
    // Drag the second node
    await secondNode.hover();
    await page.mouse.down();
    await page.mouse.move(initialBounds!.x + 80, initialBounds!.y + 60);
    await page.mouse.up();
    
    await page.waitForTimeout(1000);
    
    const newBounds = await secondNode.boundingBox();
    const moved = Math.abs(newBounds!.x - initialBounds!.x) > 40 || 
                  Math.abs(newBounds!.y - initialBounds!.y) > 30;
    
    expect(moved).toBe(true);
    console.log('✅ Multiple node drag test passed!');
  });
});