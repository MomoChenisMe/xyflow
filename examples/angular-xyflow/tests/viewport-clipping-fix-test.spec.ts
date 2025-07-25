import { test, expect } from '@playwright/test';

/**
 * Viewport Clipping Fix Test
 * 
 * This test specifically verifies the fix for the invisible frame clipping issue
 * when nodes are dragged to corners after zooming out. This follows React Flow's
 * approach of using overflow: hidden with scroll reset mechanism.
 */

test.describe('Viewport Clipping Fix Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/examples/basic');
    await page.waitForSelector('.xy-flow__node');
    await page.waitForTimeout(2000);
  });

  test('should fix node visual clipping when zoomed out and dragged to top-left corner', async ({ page }) => {
    console.log('🔍 Testing viewport clipping fix...');
    
    // Find node 1 to test with
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    // Get initial node position and verify visibility
    const initialBounds = await node1.boundingBox();
    if (!initialBounds) throw new Error('Could not get initial bounds');
    console.log('Initial node bounds:', initialBounds);
    
    // Step 1: Significantly zoom out to trigger potential clipping issues
    console.log('🔍 Zooming out workflow significantly...');
    const flowContainer = page.locator('.react-flow, .xy-flow').first();
    
    // Zoom out multiple times to make clipping more apparent
    for (let i = 0; i < 6; i++) {
      await flowContainer.hover();
      await page.mouse.wheel(0, 400); // Aggressive zoom out
      await page.waitForTimeout(200);
    }
    
    console.log('✅ Workflow zoomed out significantly');
    
    // Step 2: Drag node to extreme top-left corner
    console.log('🔍 Dragging node to extreme top-left corner...');
    
    // Get current node position after zoom
    const zoomedBounds = await node1.boundingBox();
    console.log('Node bounds after zoom:', zoomedBounds);
    
    await node1.hover();
    await page.mouse.down();
    
    // Drag to extreme top-left corner - this used to cause clipping
    await page.mouse.move(20, 20, { steps: 10 });
    await page.waitForTimeout(500);
    
    // Capture position during drag
    const dragBounds = await node1.boundingBox();
    console.log('Node bounds during drag to corner:', dragBounds);
    
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    // Step 3: Verify node is fully visible and not clipped
    const finalBounds = await node1.boundingBox();
    console.log('Final node bounds at corner:', finalBounds);
    
    // The node should still be visible and have proper dimensions
    expect(finalBounds).toBeTruthy();
    expect(finalBounds!.width).toBeGreaterThan(50); // Should have reasonable width
    expect(finalBounds!.height).toBeGreaterThan(20); // Should have reasonable height
    
    // Node should be positioned in the top-left area
    expect(finalBounds!.x).toBeLessThan(100); // Should be in left area
    expect(finalBounds!.y).toBeLessThan(100); // Should be in top area
    
    console.log('✅ Node is fully visible at top-left corner');
    
    // Step 4: Test node content visibility (critical check for clipping)
    console.log('🔍 Checking node content visibility...');
    
    // Check if node text/content is visible
    const nodeContent = node1.locator('.node-label, .xy-flow__node-default, text');
    await expect(nodeContent.first()).toBeVisible();
    
    // Check node interaction - it should still be clickable
    await node1.click();
    await page.waitForTimeout(200);
    
    console.log('✅ Node content is visible and interactive');
    
    // Step 5: Test dragging to other extreme corners
    const extremePositions = [
      { x: 10, y: 500, name: 'bottom-left' },
      { x: 500, y: 10, name: 'top-right' },
      { x: 500, y: 500, name: 'bottom-right' }
    ];
    
    for (const pos of extremePositions) {
      console.log(`🔍 Testing ${pos.name} corner...`);
      
      await node1.hover();
      await page.mouse.down();
      await page.mouse.move(pos.x, pos.y, { steps: 5 });
      await page.waitForTimeout(300);
      
      const cornerBounds = await node1.boundingBox();
      expect(cornerBounds).toBeTruthy();
      expect(cornerBounds!.width).toBeGreaterThan(50);
      expect(cornerBounds!.height).toBeGreaterThan(20);
      
      await page.mouse.up();
      await page.waitForTimeout(200);
      
      console.log(`✅ Node visible at ${pos.name} corner`);
    }
    
    console.log('\\n🎉 Viewport clipping fix test passed! Nodes are no longer clipped by invisible frames.');
  });

  test('should handle scroll reset mechanism correctly', async ({ page }) => {
    console.log('🔍 Testing scroll reset mechanism...');
    
    // Get the main flow container
    const flowContainer = page.locator('.react-flow').first();
    
    // Monitor scroll events
    const scrollEvents: any[] = [];
    await page.evaluate(() => {
      const container = document.querySelector('.react-flow');
      if (container) {
        container.addEventListener('scroll', (e) => {
          (window as any).scrollEvents = (window as any).scrollEvents || [];
          (window as any).scrollEvents.push({
            scrollTop: (e.target as HTMLElement).scrollTop,
            scrollLeft: (e.target as HTMLElement).scrollLeft,
            timestamp: Date.now()
          });
        });
      }
    });
    
    // Zoom out and drag node to trigger potential scroll
    const node1 = page.locator('[data-id="1"]').first();
    
    // Zoom out
    for (let i = 0; i < 4; i++) {
      await flowContainer.hover();
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(150);
    }
    
    // Drag node to extreme position
    await node1.hover();
    await page.mouse.down();
    await page.mouse.move(-50, -50, { steps: 5 });
    await page.mouse.up();
    
    await page.waitForTimeout(1000);
    
    // Check if scroll position is reset
    const scrollState = await page.evaluate(() => {
      const container = document.querySelector('.react-flow') as HTMLElement;
      return {
        scrollTop: container?.scrollTop || 0,
        scrollLeft: container?.scrollLeft || 0,
        events: (window as any).scrollEvents || []
      };
    });
    
    console.log('Scroll state:', scrollState);
    
    // Scroll should be reset to 0,0
    expect(scrollState.scrollTop).toBe(0);
    expect(scrollState.scrollLeft).toBe(0);
    
    console.log('✅ Scroll reset mechanism working correctly');
    console.log('\\n🎉 Scroll reset test passed!');
  });

  test('should maintain node visibility during continuous drag operations', async ({ page }) => {
    console.log('🔍 Testing continuous drag visibility...');
    
    const node1 = page.locator('[data-id="1"]').first();
    
    // Zoom out first
    const flowContainer = page.locator('.react-flow').first();
    for (let i = 0; i < 5; i++) {
      await flowContainer.hover();
      await page.mouse.wheel(0, 350);
      await page.waitForTimeout(100);
    }
    
    // Perform continuous drag in a pattern that would expose clipping issues
    const dragPattern = [
      { x: 50, y: 50 },
      { x: 10, y: 10 },    // Extreme top-left
      { x: 200, y: 10 },   // Top-right
      { x: 200, y: 300 },  // Bottom-right
      { x: 10, y: 300 },   // Bottom-left
      { x: 100, y: 100 }   // Center
    ];
    
    await node1.hover();
    await page.mouse.down();
    
    for (const [index, point] of dragPattern.entries()) {
      console.log(`🔍 Dragging to point ${index + 1}: (${point.x}, ${point.y})`);
      
      await page.mouse.move(point.x, point.y, { steps: 3 });
      await page.waitForTimeout(200);
      
      // Check node is still visible at each point
      const bounds = await node1.boundingBox();
      expect(bounds).toBeTruthy();
      expect(bounds!.width).toBeGreaterThan(30);
      expect(bounds!.height).toBeGreaterThan(15);
      
      console.log(`✅ Node visible at point ${index + 1}`);
    }
    
    await page.mouse.up();
    
    console.log('\\n🎉 Continuous drag visibility test passed!');
  });
});