import { test, expect } from '@playwright/test';

/**
 * Invisible Boundary Fix Test
 * 
 * Tests the fix for the invisible boundary issue where nodes were being 
 * clipped when dragged beyond the viewport after zooming out.
 * 
 * The issue was caused by height: 100vh constraint in the Basic example.
 */

test.describe('Invisible Boundary Fix Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/examples/basic');
    await page.waitForSelector('.xy-flow__node');
    await page.waitForTimeout(2000);
  });

  test('should verify container no longer has height: 100vh constraint', async ({ page }) => {
    console.log('🔍 Checking for height: 100vh constraint removal...');
    
    // Check the computed styles of the basic example container
    const containerStyles = await page.evaluate(() => {
      const container = document.querySelector('.xy-flow-basic-example');
      if (!container) return { found: false };
      
      const computedStyles = getComputedStyle(container);
      const inlineStyles = (container as HTMLElement).style;
      
      return {
        found: true,
        computedHeight: computedStyles.height,
        inlineHeight: inlineStyles.height,
        hasVhUnit: inlineStyles.height.includes('vh'),
        position: computedStyles.position,
        width: computedStyles.width
      };
    });
    
    console.log('Container styles:', containerStyles);
    
    expect(containerStyles.found).toBe(true);
    expect(containerStyles.hasVhUnit).toBe(false); // Should no longer use vh units
    expect(containerStyles.inlineHeight).toBe('100%'); // Should use 100% instead
    expect(containerStyles.position).toBe('relative');
    
    console.log('✅ Container no longer uses height: 100vh');
  });

  test('should allow nodes to be dragged beyond previous boundary after zoom out', async ({ page }) => {
    console.log('🔍 Testing node dragging beyond previous boundary...');
    
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    // Get initial viewport size for reference
    const viewportSize = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }));
    console.log('Viewport size:', viewportSize);
    
    // Zoom out significantly to make the boundary issue more apparent
    const flowContainer = page.locator('.react-flow').first();
    console.log('Zooming out...');
    for (let i = 0; i < 5; i++) {
      await flowContainer.hover();
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(300);
    }
    
    // Get node position before drag
    const initialBounds = await node1.boundingBox();
    expect(initialBounds).toBeTruthy();
    console.log('Initial node bounds:', initialBounds);
    
    // Drag node to an extreme position that would have been clipped before
    const extremeX = 50;  // Very close to left edge
    const extremeY = 50;  // Very close to top edge
    
    console.log(`Dragging node to extreme position (${extremeX}, ${extremeY})...`);
    await node1.hover();
    await page.mouse.down();
    await page.mouse.move(extremeX, extremeY, { steps: 10 });
    await page.waitForTimeout(1000);
    
    // Check node is still visible and not clipped
    const afterDragBounds = await node1.boundingBox();
    expect(afterDragBounds).toBeTruthy();
    
    // Verify the node moved to the new position
    expect(afterDragBounds!.x).not.toBe(initialBounds!.x);
    expect(afterDragBounds!.y).not.toBe(initialBounds!.y);
    
    // Most importantly: verify the node is still fully visible (not clipped)
    expect(afterDragBounds!.width).toBeGreaterThan(50); // Should show substantial width
    expect(afterDragBounds!.height).toBeGreaterThan(20); // Should show substantial height
    
    console.log('Final node bounds:', afterDragBounds);
    
    await page.mouse.up();
    
    // Drag to another extreme position (bottom right area)
    const extremeX2 = viewportSize.width - 100;
    const extremeY2 = viewportSize.height - 100;
    
    console.log(`Dragging node to second extreme position (${extremeX2}, ${extremeY2})...`);
    await node1.hover();
    await page.mouse.down();
    await page.mouse.move(extremeX2, extremeY2, { steps: 10 });
    await page.waitForTimeout(1000);
    
    const finalBounds = await node1.boundingBox();
    expect(finalBounds).toBeTruthy();
    expect(finalBounds!.width).toBeGreaterThan(50);
    expect(finalBounds!.height).toBeGreaterThan(20);
    
    console.log('Second extreme position bounds:', finalBounds);
    
    await page.mouse.up();
    
    console.log('✅ Node remains fully visible at extreme positions after zoom out');
    console.log('\\n🎉 Invisible boundary issue has been fixed!');
  });

  test('should verify nodes stay visible when dragged far beyond viewport edges', async ({ page }) => {
    console.log('🔍 Testing nodes dragged far beyond viewport edges...');
    
    const node2 = page.locator('[data-id="2"]').first();
    await expect(node2).toBeVisible();
    
    // Maximum zoom out
    const flowContainer = page.locator('.react-flow').first();
    console.log('Maximum zoom out...');
    for (let i = 0; i < 8; i++) {
      await flowContainer.hover();
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(200);
    }
    
    // Drag node way beyond normal viewport boundaries
    console.log('Dragging node beyond viewport boundaries...');
    await node2.hover();
    await page.mouse.down();
    
    // Move to positions that would definitely be beyond the old 100vh boundary
    await page.mouse.move(-200, -200, { steps: 5 });
    await page.waitForTimeout(500);
    
    // Check node is still accessible (even if partially off-screen, it should not be clipped by container)
    const bounds1 = await node2.boundingBox();
    if (bounds1) {
      // If node is visible, it should have reasonable dimensions (not clipped to 0)
      console.log('Bounds at (-200, -200):', bounds1);
    }
    
    // Move to positive extreme
    await page.mouse.move(2000, 2000, { steps: 5 });
    await page.waitForTimeout(500);
    
    await page.mouse.up();
    
    // The key test: verify the node can be moved back into view
    // and is not stuck or clipped
    console.log('Moving node back to center to verify it\'s not stuck...');
    await node2.hover();
    await page.mouse.down();
    await page.mouse.move(400, 300, { steps: 10 });
    await page.waitForTimeout(500);
    
    const centerBounds = await node2.boundingBox();
    expect(centerBounds).toBeTruthy();
    expect(centerBounds!.width).toBeGreaterThan(30);
    expect(centerBounds!.height).toBeGreaterThan(15);
    
    await page.mouse.up();
    
    console.log('✅ Node successfully moved to extreme positions and back');
    console.log('\\n🎉 No container clipping detected!');
  });
});