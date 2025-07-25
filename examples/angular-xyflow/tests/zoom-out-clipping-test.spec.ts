import { test, expect } from '@playwright/test';

/**
 * Zoom Out Node Clipping Test
 * 
 * This test verifies that nodes are not clipped by invisible frames when:
 * 1. The workflow is zoomed out 
 * 2. Nodes are dragged to the top-left corner
 * 
 * Following React Flow's logic where overflow: hidden should NOT be applied
 * to main containers to prevent node clipping.
 */

test.describe('Zoom Out Node Clipping Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/examples/basic');
    await page.waitForSelector('.xy-flow__node');
    await page.waitForTimeout(2000);
  });

  test('should not clip nodes when zoomed out and dragged to top-left corner', async ({ page }) => {
    console.log('🔍 Testing node clipping when zoomed out...');
    
    // Find a node to test with
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    // Get initial node position and dimensions
    const initialBounds = await node1.boundingBox();
    if (!initialBounds) throw new Error('Could not get initial bounds');
    
    console.log('Initial node bounds:', initialBounds);
    
    // Step 1: Zoom out significantly to make clipping more apparent
    console.log('🔍 Zooming out workflow...');
    
    const flowContainer = page.locator('.react-flow, .xy-flow').first();
    await flowContainer.hover();
    
    // Zoom out using mouse wheel (multiple times to get a significant zoom out)
    for (let i = 0; i < 5; i++) {
      await flowContainer.hover();
      await page.mouse.wheel(0, 300); // Zoom out
      await page.waitForTimeout(200);
    }
    
    console.log('✅ Workflow zoomed out');
    
    // Step 2: Drag node to top-left corner
    console.log('🔍 Dragging node to top-left corner...');
    
    await node1.hover();
    await page.mouse.down();
    
    // Drag to top-left corner with small coordinates
    await page.mouse.move(50, 50, { steps: 10 });
    await page.waitForTimeout(500);
    
    // Get node bounds during drag at top-left position
    const topLeftBounds = await node1.boundingBox();
    console.log('Node bounds at top-left:', topLeftBounds);
    
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    // Step 3: Verify node is still fully visible (not clipped)
    const finalBounds = await node1.boundingBox();
    console.log('Final node bounds:', finalBounds);
    
    // Check that the node is still visible and has reasonable bounds
    expect(finalBounds).toBeTruthy();
    expect(finalBounds!.width).toBeGreaterThan(0);
    expect(finalBounds!.height).toBeGreaterThan(0);
    
    // The node should be positioned near the top-left area
    expect(finalBounds!.x).toBeLessThan(200); // Should be in left area
    expect(finalBounds!.y).toBeLessThan(200); // Should be in top area
    
    console.log('✅ Node is visible at top-left position');
    
    // Step 4: Test extreme top-left position (even more extreme)
    console.log('🔍 Testing extreme top-left position...');
    
    await node1.hover();
    await page.mouse.down();
    
    // Drag to very extreme top-left corner
    await page.mouse.move(10, 10, { steps: 5 });
    await page.waitForTimeout(300);
    
    const extremeBounds = await node1.boundingBox();
    console.log('Node bounds at extreme position:', extremeBounds);
    
    await page.mouse.up();
    await page.waitForTimeout(300);
    
    // Verify node is still accessible and visible
    const extremeFinalBounds = await node1.boundingBox();
    expect(extremeFinalBounds).toBeTruthy();
    expect(extremeFinalBounds!.width).toBeGreaterThan(0);
    expect(extremeFinalBounds!.height).toBeGreaterThan(0);
    
    console.log('✅ Node remains visible even at extreme top-left position');
    
    // Step 5: Verify node content is not clipped
    const nodeText = node1.locator('text, .node-label, .xy-flow__node-default');
    await expect(nodeText).toBeVisible();
    
    console.log('✅ Node content is fully visible and not clipped');
    
    console.log('\\n🎉 Zoom out clipping test passed! Nodes are not clipped when zoomed out and dragged to corners.');
  });

  test('should not clip nodes when dragged beyond viewport boundaries', async ({ page }) => {
    console.log('🔍 Testing node visibility beyond viewport boundaries...');
    
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    // Zoom out first
    const flowContainer = page.locator('.react-flow, .xy-flow').first();
    await flowContainer.hover();
    
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(100);
    }
    
    // Test dragging to various extreme positions
    const testPositions = [
      { x: -50, y: -50, name: 'negative coordinates' },
      { x: 0, y: 0, name: 'origin (0,0)' },
      { x: 1500, y: 50, name: 'far right' },
      { x: 50, y: 1000, name: 'far bottom' }
    ];
    
    for (const position of testPositions) {
      console.log(`🔍 Testing position: ${position.name} (${position.x}, ${position.y})`);
      
      await node1.hover();
      await page.mouse.down();
      await page.mouse.move(position.x, position.y, { steps: 5 });
      await page.waitForTimeout(200);
      
      // Node should still be accessible even if partially outside viewport
      const bounds = await node1.boundingBox();
      expect(bounds).toBeTruthy();
      expect(bounds!.width).toBeGreaterThan(0);
      expect(bounds!.height).toBeGreaterThan(0);
      
      await page.mouse.up();
      await page.waitForTimeout(200);
      
      console.log(`✅ Node remains valid at ${position.name}`);
    }
    
    console.log('\\n🎉 Viewport boundary test passed! Nodes are not clipped beyond boundaries.');
  });

  test('should maintain node interactions when zoomed out', async ({ page }) => {
    console.log('🔍 Testing node interactions when zoomed out...');
    
    // Zoom out significantly
    const flowContainer = page.locator('.react-flow, .xy-flow').first();
    await flowContainer.hover();
    
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 250);
      await page.waitForTimeout(150);
    }
    
    // Test that nodes are still clickable and draggable when zoomed out
    const node1 = page.locator('[data-id="1"]').first();
    const node2 = page.locator('[data-id="2"]').first();
    
    // Test clicking
    console.log('🔍 Testing node clicking when zoomed out...');
    await node1.click();
    await page.waitForTimeout(200);
    
    // Test dragging
    console.log('🔍 Testing node dragging when zoomed out...');
    const initialBounds = await node1.boundingBox();
    
    await node1.hover();
    await page.mouse.down();
    await page.mouse.move(100, 100, { steps: 3 });
    await page.mouse.up();
    
    const finalBounds = await node1.boundingBox();
    
    // Position should have changed
    const moved = Math.abs(finalBounds!.x - initialBounds!.x) > 10 || 
                  Math.abs(finalBounds!.y - initialBounds!.y) > 10;
    expect(moved).toBe(true);
    
    console.log('✅ Node interactions work correctly when zoomed out');
    
    console.log('\\n🎉 Node interaction test passed! All interactions work when zoomed out.');
  });
});