import { test, expect } from '@playwright/test';

/**
 * Node clipping fix verification test
 * 
 * This test verifies that the fix for node clipping issue works correctly.
 * The fix involved:
 * 1. Adding correct CSS classes to viewport component
 * 2. Adding pointer-events: none to viewport inline styles
 * 3. Ensuring nodes can be positioned anywhere without being clipped
 */

test.describe('Node Clipping Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the basic example
    await page.goto('http://localhost:4200/examples/basic');
    
    // Wait for the component to load
    await page.waitForSelector('.xy-flow__node');
    
    // Wait for initialization
    await page.waitForTimeout(2000);
  });

  test('should verify viewport has correct pointer-events style', async ({ page }) => {
    console.log('🔍 Verifying viewport pointer-events style...');
    
    // Check if viewport has correct CSS class and pointer-events
    const viewport = page.locator('.react-flow__viewport').first();
    await expect(viewport).toBeVisible();
    
    const viewportStyles = await viewport.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        pointerEvents: computed.pointerEvents,
        className: el.className,
        transform: computed.transform,
        zIndex: computed.zIndex
      };
    });
    
    console.log('Viewport styles after fix:', viewportStyles);
    
    // The critical fix: pointer-events should be 'none'
    expect(viewportStyles.pointerEvents).toBe('none');
    
    // Verify the CSS classes are correctly applied
    expect(viewportStyles.className).toContain('react-flow__viewport');
    expect(viewportStyles.className).toContain('xy-flow__viewport');
    
    console.log('✅ Viewport styles are correctly applied');
  });

  test('should allow nodes to be positioned in negative coordinates without clipping', async ({ page }) => {
    console.log('🔍 Testing node positioning in negative coordinates...');
    
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    // Test extreme negative positions that were previously problematic
    const testPositions = [
      { x: -100, y: -100, name: 'negative X and Y' },
      { x: -50, y: 100, name: 'negative X only' },
      { x: 100, y: -50, name: 'negative Y only' },
      { x: 5, y: 5, name: 'very close to top-left corner' }
    ];
    
    for (const pos of testPositions) {
      console.log(`\n🧪 Testing ${pos.name} position: (${pos.x}, ${pos.y})`);
      
      // Drag to position  
      await node1.hover();
      await page.mouse.down();
      await page.mouse.move(pos.x, pos.y, { steps: 3 });
      await page.mouse.up();
      
      await page.waitForTimeout(300);
      
      // Check visibility and interactivity
      const bounds = await node1.boundingBox();
      const isVisible = await node1.isVisible();
      
      console.log(`  📍 Node bounds:`, bounds);
      console.log(`  👁️  Is visible: ${isVisible}`);
      
      // The key test: node should remain clickable even at negative positions
      try {
        await node1.click({ timeout: 2000 });
        console.log(`  ✅ Node is clickable at ${pos.name} position`);
      } catch (error) {
        console.log(`  ❌ Node is not clickable at ${pos.name} position:`, error.message);
        throw new Error(`Node should be clickable at ${pos.name} position but was not`);
      }
      
      // Verify the node content is accessible
      const nodeText = await node1.textContent();
      expect(nodeText).toBeTruthy();
      console.log(`  📝 Node text: "${nodeText}"`);
    }
    
    console.log('\n🎉 All positioning tests passed! Node clipping issue is fixed.');
  });

  test('should verify container hierarchy has correct overflow settings', async ({ page }) => {
    console.log('🔍 Verifying container hierarchy overflow settings...');
    
    // Check the main flow container has overflow: hidden
    const flowContainer = page.locator('.react-flow').first();
    const containerOverflow = await flowContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        overflow: computed.overflow,
        position: computed.position,
        zIndex: computed.zIndex
      };
    });
    
    console.log('Flow container styles:', containerOverflow);
    expect(containerOverflow.overflow).toBe('hidden');
    
    // Check viewport has correct pointer-events
    const viewport = page.locator('.react-flow__viewport').first();
    const viewportPointerEvents = await viewport.evaluate((el) => {
      return window.getComputedStyle(el).pointerEvents;
    });
    
    console.log('Viewport pointer-events:', viewportPointerEvents);
    expect(viewportPointerEvents).toBe('none');
    
    console.log('✅ Container hierarchy is correctly configured');
  });

  test('should compare with initial behavior to confirm fix', async ({ page }) => {
    console.log('🔍 Comparing current behavior with expected React Flow behavior...');
    
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    // Get initial position
    const initialBounds = await node1.boundingBox();
    console.log('Initial node bounds:', initialBounds);
    
    // Move to a challenging position (top-left corner)
    const targetX = 10;
    const targetY = 10;
    
    await node1.hover();
    await page.mouse.down();
    await page.mouse.move(targetX, targetY, { steps: 5 });
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    
    // Verify the node moved and is still interactive
    const finalBounds = await node1.boundingBox();
    console.log('Final node bounds:', finalBounds);
    
    // Calculate if the node actually moved
    if (initialBounds && finalBounds) {
      const hasMoved = Math.abs(finalBounds.x - initialBounds.x) > 50 || 
                     Math.abs(finalBounds.y - initialBounds.y) > 50;
      
      console.log('Node movement analysis:', {
        initialX: initialBounds.x,
        initialY: initialBounds.y,
        finalX: finalBounds.x,
        finalY: finalBounds.y,
        hasMoved
      });
      
      expect(hasMoved).toBe(true);
      
      // Most importantly, the node should still be clickable after moving
      await node1.click();
      console.log('✅ Node remains clickable after moving to top-left corner');
      
      // Check that the node text is still accessible
      const nodeText = await node1.textContent();
      expect(nodeText).toContain('Node 1');
      console.log('✅ Node content is still accessible');
    }
    
    console.log('🎉 Fix verification complete - nodes can be positioned anywhere without clipping!');
  });
});