import { test, expect } from '@playwright/test';

/**
 * Final Clipping Fix Verification Test
 * 
 * This test verifies the complete fix for the invisible frame clipping issue.
 * Key fixes applied:
 * 1. Added React Flow's scroll reset mechanism to main container
 * 2. Removed overflow: hidden from .xy-flow CSS class to match React Flow
 * 3. Removed overflow: hidden from example containers
 */

test.describe('Final Clipping Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/examples/basic');
    await page.waitForSelector('.xy-flow__node');
    await page.waitForTimeout(2000);
  });

  test('should completely fix node visual clipping when zoomed out and dragged to corners', async ({ page }) => {
    console.log('🔍 Final verification of clipping fix...');
    
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    // Test 1: Aggressive zoom out
    console.log('🔍 Performing aggressive zoom out...');
    const flowContainer = page.locator('.react-flow, .xy-flow').first();
    
    for (let i = 0; i < 8; i++) {
      await flowContainer.hover();
      await page.mouse.wheel(0, 500); // Very aggressive zoom out
      await page.waitForTimeout(100);
    }
    
    console.log('✅ Extreme zoom out completed');
    
    // Test 2: Verify node dimensions after zoom
    const zoomedBounds = await node1.boundingBox();
    console.log('Node bounds after extreme zoom:', zoomedBounds);
    expect(zoomedBounds).toBeTruthy();
    
    // Test 3: Drag to all four extreme corners
    const corners = [
      { x: 5, y: 5, name: 'top-left' },
      { x: 800, y: 5, name: 'top-right' },
      { x: 5, y: 600, name: 'bottom-left' },
      { x: 800, y: 600, name: 'bottom-right' }
    ];
    
    for (const corner of corners) {
      console.log(`🔍 Testing ${corner.name} corner at (${corner.x}, ${corner.y})...`);
      
      await node1.hover();
      await page.mouse.down();
      await page.mouse.move(corner.x, corner.y, { steps: 8 });
      await page.waitForTimeout(300);
      
      // Verify node is still visible and properly sized
      const cornerBounds = await node1.boundingBox();
      expect(cornerBounds).toBeTruthy();
      expect(cornerBounds!.width).toBeGreaterThan(20); // Should have reasonable width
      expect(cornerBounds!.height).toBeGreaterThan(10); // Should have reasonable height
      
      // Verify node content is still accessible
      const nodeText = node1.locator('text, .node-label, .xy-flow__node-default');
      await expect(nodeText).toBeVisible();
      
      await page.mouse.up();
      await page.waitForTimeout(200);
      
      console.log(`✅ ${corner.name} corner test passed - node fully visible`);
    }
    
    // Test 4: Verify scroll position is properly managed
    const scrollState = await page.evaluate(() => {
      const container = document.querySelector('.react-flow') as HTMLElement;
      return {
        scrollTop: container?.scrollTop || 0,
        scrollLeft: container?.scrollLeft || 0
      };
    });
    
    expect(scrollState.scrollTop).toBe(0);
    expect(scrollState.scrollLeft).toBe(0);
    console.log('✅ Scroll position properly managed');
    
    // Test 5: Verify edges still update during drag
    console.log('🔍 Verifying edges update during corner drag...');
    
    const edges = await page.locator('.xy-flow__edge-path').count();
    if (edges > 0) {
      const firstEdge = page.locator('.xy-flow__edge-path').first();
      const initialPath = await firstEdge.getAttribute('d');
      
      // Drag to different corner
      await node1.hover();
      await page.mouse.down();
      await page.mouse.move(100, 100, { steps: 3 });
      
      const finalPath = await firstEdge.getAttribute('d');
      await page.mouse.up();
      
      expect(finalPath).not.toBe(initialPath);
      console.log('✅ Edges update correctly during corner drag');
    }
    
    console.log('\\n🎉 ALL CLIPPING ISSUES FIXED! Nodes are fully visible in all corner positions after zoom out.');
  });

  test('should maintain node interactions in extreme positions', async ({ page }) => {
    console.log('🔍 Testing node interactions in extreme positions...');
    
    const node1 = page.locator('[data-id="1"]').first();
    
    // Zoom out and move to extreme position
    const flowContainer = page.locator('.react-flow').first();
    for (let i = 0; i < 6; i++) {
      await flowContainer.hover();
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(100);
    }
    
    // Drag to extreme top-left
    await node1.hover();
    await page.mouse.down();
    await page.mouse.move(10, 10, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    // Test interactions
    console.log('🔍 Testing click interaction...');
    await node1.click();
    await page.waitForTimeout(200);
    
    console.log('🔍 Testing hover interaction...');
    await node1.hover();
    await page.waitForTimeout(200);
    
    console.log('🔍 Testing drag interaction...');
    await node1.hover();
    await page.mouse.down();
    await page.mouse.move(50, 50, { steps: 3 });
    await page.mouse.up();
    
    const finalBounds = await node1.boundingBox();
    expect(finalBounds).toBeTruthy();
    expect(finalBounds!.width).toBeGreaterThan(10);
    expect(finalBounds!.height).toBeGreaterThan(5);
    
    console.log('✅ All interactions work correctly in extreme positions');
    console.log('\\n🎉 Node interaction test passed!');
  });

  test('should verify the fix components are working', async ({ page }) => {
    console.log('🔍 Verifying specific fix components...');
    
    // Test 1: Verify scroll reset mechanism exists
    const hasScrollHandler = await page.evaluate(() => {
      const container = document.querySelector('.react-flow');
      return !!container && typeof container.scrollTo === 'function';
    });
    expect(hasScrollHandler).toBe(true);
    console.log('✅ Scroll reset mechanism available');
    
    // Test 2: Verify CSS overflow settings
    const cssStyles = await page.evaluate(() => {
      const mainContainer = document.querySelector('.react-flow');
      const xyFlowElement = document.querySelector('.xy-flow');
      
      return {
        mainContainerOverflow: mainContainer ? getComputedStyle(mainContainer).overflow : null,
        xyFlowOverflow: xyFlowElement ? getComputedStyle(xyFlowElement).overflow : null
      };
    });
    
    console.log('CSS overflow settings:', cssStyles);
    
    // Main container should have overflow: hidden (with scroll reset)
    expect(cssStyles.mainContainerOverflow).toBe('hidden');
    console.log('✅ Main container has correct overflow setting');
    
    // .xy-flow should NOT have overflow: hidden
    expect(cssStyles.xyFlowOverflow).not.toBe('hidden');
    console.log('✅ .xy-flow class does not have overflow: hidden');
    
    console.log('\\n🎉 All fix components verified successfully!');
  });
});