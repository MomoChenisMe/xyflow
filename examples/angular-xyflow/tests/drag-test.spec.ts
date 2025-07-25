import { test, expect } from '@playwright/test';

test.describe('Angular Flow Drag Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4201');
    await page.waitForTimeout(2000);
  });

  test('should allow node dragging', async ({ page }) => {
    // Find the first node
    const node = page.locator('[data-id="1"]').first();
    await expect(node).toBeVisible();
    
    // Get initial position
    const initialBBox = await node.boundingBox();
    expect(initialBBox).not.toBeNull();
    
    // Perform drag operation
    await node.hover();
    await node.dragTo(page.locator('body'), { 
      targetPosition: { 
        x: initialBBox!.x + 100, 
        y: initialBBox!.y + 100 
      } 
    });
    
    // Wait for animation/state update
    await page.waitForTimeout(500);
    
    // Get final position
    const finalBBox = await node.boundingBox();
    expect(finalBBox).not.toBeNull();
    
    // Check if node has moved
    const movedX = Math.abs(finalBBox!.x - initialBBox!.x);
    const movedY = Math.abs(finalBBox!.y - initialBBox!.y);
    
    console.log(`Node moved by X: ${movedX}, Y: ${movedY}`);
    
    // Expect the node to have moved significantly (more than 50px in either direction)
    expect(movedX > 50 || movedY > 50).toBeTruthy();
  });

  test('should show proper cursor states', async ({ page }) => {
    const node = page.locator('[data-id="1"]').first();
    await expect(node).toBeVisible();
    
    // Check hover cursor
    await node.hover();
    const cursor = await node.evaluate(el => window.getComputedStyle(el).cursor);
    
    console.log(`Node cursor: ${cursor}`);
    
    // Should show grab or pointer cursor
    expect(['grab', 'pointer', 'default'].includes(cursor)).toBeTruthy();
  });

  test('should show node handles', async ({ page }) => {
    const node = page.locator('[data-id="1"]').first();
    await expect(node).toBeVisible();
    
    // Check for handles within the node
    const handles = node.locator('xy-handle');
    const handleCount = await handles.count();
    
    console.log(`Node has ${handleCount} handles`);
    
    // Should have at least one handle
    expect(handleCount).toBeGreaterThan(0);
    
    // Check handle visibility
    const firstHandle = handles.first();
    await expect(firstHandle).toBeVisible();
  });
});