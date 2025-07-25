import { test, expect } from '@playwright/test';

test.describe('Simple Drag Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000); // Wait for Angular to bootstrap
  });

  test('should render nodes', async ({ page }) => {
    // Check if nodes are visible
    const nodes = page.locator('[data-id]');
    const count = await nodes.count();
    console.log(`Found ${count} nodes`);
    
    expect(count).toBeGreaterThan(0);
    
    // Check first node
    const firstNode = nodes.first();
    await expect(firstNode).toBeVisible();
    
    const nodeClasses = await firstNode.getAttribute('class');
    console.log(`First node classes: ${nodeClasses}`);
  });

  test('should check node cursor', async ({ page }) => {
    const firstNode = page.locator('[data-id="1"]').first();
    await expect(firstNode).toBeVisible();
    
    await firstNode.hover();
    
    // Check computed cursor style
    const cursor = await firstNode.evaluate(el => {
      return window.getComputedStyle(el).cursor;
    });
    
    console.log(`Node cursor: ${cursor}`);
    
    // Should have grab cursor for draggable nodes
    expect(cursor).toBe('grab');
  });

  test('should test basic drag', async ({ page }) => {
    const firstNode = page.locator('[data-id="1"]').first();
    await expect(firstNode).toBeVisible();
    
    // Get initial position
    const initialBox = await firstNode.boundingBox();
    console.log(`Initial position: ${JSON.stringify(initialBox)}`);
    
    // Try to drag the node
    await firstNode.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + 100, initialBox!.y + 100);
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    
    // Get new position
    const finalBox = await firstNode.boundingBox();
    console.log(`Final position: ${JSON.stringify(finalBox)}`);
    
    // Check if position changed
    const moved = (finalBox!.x !== initialBox!.x || finalBox!.y !== initialBox!.y);
    console.log(`Node moved: ${moved}`);
    
    expect(moved).toBe(true);
  });
});