import { test, expect } from '@playwright/test';

test.describe('Debug Drag Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  test('should trigger mousedown event on node', async ({ page }) => {
    // Set up console logging
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    const firstNode = page.locator('[data-id="1"]').first();
    await expect(firstNode).toBeVisible();
    
    // Try to click and hold the node
    await firstNode.hover();
    await firstNode.dispatchEvent('mousedown', { button: 0 });
    await page.waitForTimeout(100);
    
    // Check if any drag-related console logs appeared
    console.log('Console logs related to drag:', consoleLogs);
    
    // The test passes if we see any drag-related logs
    if (consoleLogs.length > 0) {
      console.log('✓ Drag events are being triggered');
    } else {
      console.log('✗ No drag events detected');
    }
  });

  test('should check drag with Playwright dragTo method', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });

    const firstNode = page.locator('[data-id="1"]').first();
    await expect(firstNode).toBeVisible();
    
    const initialBox = await firstNode.boundingBox();
    console.log('Initial position:', initialBox);
    
    // Use Playwright's dragTo method
    await firstNode.dragTo(page.locator('body'), { 
      targetPosition: { 
        x: (initialBox?.x || 0) + 100, 
        y: (initialBox?.y || 0) + 100 
      } 
    });
    
    await page.waitForTimeout(1000);
    
    const finalBox = await firstNode.boundingBox();
    console.log('Final position:', finalBox);
    
    // Log all console messages to see what's happening
    console.log('All console logs:', consoleLogs.filter(log => 
      log.includes('drag') || log.includes('mouse') || log.includes('nodes change')
    ));
    
    const moved = finalBox && initialBox && (
      Math.abs(finalBox.x - initialBox.x) > 10 || 
      Math.abs(finalBox.y - initialBox.y) > 10
    );
    
    console.log('Node moved:', moved);
  });

  test('should test manual mouse events', async ({ page }) => {
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      } else if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const firstNode = page.locator('[data-id="1"]').first();
    await expect(firstNode).toBeVisible();
    
    const box = await firstNode.boundingBox();
    if (!box) throw new Error('Could not get node bounding box');
    
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    console.log(`Starting drag test from center: ${centerX}, ${centerY}`);
    
    // Manual mouse sequence
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    
    // Wait a bit and check if drag started
    await page.waitForTimeout(50);
    
    console.log('After mousedown, logs so far:', consoleLogs.filter(log => 
      log.includes('NodeWrapper') || log.includes('drag') || log.includes('mouse')
    ));
    
    // Now move mouse
    await page.mouse.move(centerX + 50, centerY + 50);
    await page.waitForTimeout(100);
    
    console.log('After mousemove, logs so far:', consoleLogs.filter(log => 
      log.includes('NodeWrapper') || log.includes('drag') || log.includes('mouse') || log.includes('nodes change')
    ));
    
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    const finalBox = await firstNode.boundingBox();
    
    console.log(`Final position:`, finalBox);
    console.log('All relevant logs:', consoleLogs.filter(log => 
      log.includes('NodeWrapper') || log.includes('drag') || log.includes('mouse') || log.includes('nodes change')
    ));
    
    console.log('Console errors:', consoleErrors);
    
    // Check if node actually moved
    const moved = finalBox && (finalBox.x !== box.x || finalBox.y !== box.y);
    console.log('Node moved:', moved);
  });
});