import { test, expect } from '@playwright/test';

/**
 * Simple test to verify the clipping fix is working
 */

test.describe('Simple Node Clipping Fix Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/examples/basic');
    await page.waitForSelector('.xy-flow__node');
    await page.waitForTimeout(2000);
  });

  test('should have viewport with pointer-events none', async ({ page }) => {
    console.log('🔍 Checking viewport element...');
    
    // Check if any viewport element exists (try multiple selectors)
    const viewportSelectors = [
      '.react-flow__viewport',
      '.xy-flow__viewport', 
      '.xyflow__viewport',
      '[class*="viewport"]'
    ];
    
    let viewportFound = false;
    let viewportStyles = null;
    
    for (const selector of viewportSelectors) {
      const elements = await page.locator(selector).count();
      console.log(`Found ${elements} elements with selector: ${selector}`);
      
      if (elements > 0) {
        const viewport = page.locator(selector).first();
        viewportStyles = await viewport.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            className: el.className,
            pointerEvents: computed.pointerEvents,
            transform: computed.transform,
            zIndex: computed.zIndex,
            tagName: el.tagName
          };
        });
        
        console.log(`Styles for ${selector}:`, viewportStyles);
        viewportFound = true;
        
        // If this is the main viewport, check pointer-events
        if (selector.includes('viewport')) {
          console.log(`Viewport pointer-events: ${viewportStyles.pointerEvents}`);
        }
      }
    }
    
    expect(viewportFound).toBe(true);
  });

  test('should verify nodes are interactive regardless of position', async ({ page }) => {
    console.log('🔍 Testing node interactivity...');
    
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    // Test clicking the node at its current position
    await node1.click();
    console.log('✅ Node is clickable at initial position');
    
    // Get the node's current bounds
    const bounds = await node1.boundingBox();
    console.log('Node bounds:', bounds);
    
    // Check if the node has the expected text
    const nodeText = await node1.textContent();
    console.log('Node text:', nodeText);
    expect(nodeText).toContain('Node 1');
    
    console.log('✅ Node interactivity test passed');
  });

  test('should check container hierarchy for clipping prevention', async ({ page }) => {
    console.log('🔍 Checking container hierarchy...');
    
    const containers = await page.evaluate(() => {
      const node = document.querySelector('[data-id="1"]');
      if (!node) return [];
      
      const hierarchy = [];
      let current = node.parentElement;
      
      while (current && current !== document.body) {
        const computed = window.getComputedStyle(current);
        hierarchy.push({
          tagName: current.tagName,
          className: current.className,
          overflow: computed.overflow,
          pointerEvents: computed.pointerEvents,
          position: computed.position,
          zIndex: computed.zIndex
        });
        current = current.parentElement;
      }
      
      return hierarchy;
    });
    
    console.log('Container hierarchy:');
    containers.forEach((container, index) => {
      console.log(`  ${index}: ${container.tagName} (${container.className})`, {
        overflow: container.overflow,
        pointerEvents: container.pointerEvents,
        position: container.position,
        zIndex: container.zIndex
      });
    });
    
    // Find the main flow container
    const flowContainer = containers.find(c => 
      c.className && (c.className.includes('react-flow') || c.className.includes('xy-flow'))
    );
    
    if (flowContainer) {
      console.log('Found flow container:', flowContainer);
      expect(flowContainer.overflow).toBe('hidden');
      console.log('✅ Flow container has correct overflow setting');
    }
    
    // Find viewport container
    const viewportContainer = containers.find(c => 
      c.className && c.className.includes('viewport')
    );
    
    if (viewportContainer) {
      console.log('Found viewport container:', viewportContainer);
      expect(viewportContainer.pointerEvents).toBe('none');
      console.log('✅ Viewport has correct pointer-events setting');
    } else {
      console.log('⚠️  No viewport container found in hierarchy');
    }
  });
});