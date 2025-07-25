import { test, expect } from '@playwright/test';

/**
 * Node clipping investigation test  
 * 
 * This test investigates the node clipping issue where nodes are being
 * cut off by invisible frame boundaries, especially in the top-left corner.
 * 
 * The test will:
 * 1. Move nodes to different positions including top-left corner
 * 2. Check if nodes remain fully visible
 * 3. Compare with React Flow behavior
 * 4. Identify the root cause of clipping
 */

test.describe('Node Clipping Investigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the basic example
    await page.goto('http://localhost:4200/examples/basic');
    
    // Wait for the component to load
    await page.waitForSelector('.xy-flow__node');
    
    // Wait for initialization
    await page.waitForTimeout(2000);
  });

  test('should investigate main container overflow settings', async ({ page }) => {
    console.log('🔍 Investigating main container overflow settings...');
    
    // Get the main flow container styles
    const flowContainer = page.locator('.react-flow').first();
    await expect(flowContainer).toBeVisible();
    
    const containerStyles = await flowContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        overflow: computed.overflow,
        overflowX: computed.overflowX,
        overflowY: computed.overflowY,
        position: computed.position,
        width: computed.width,
        height: computed.height,
        zIndex: computed.zIndex
      };
    });
    
    console.log('Flow Container Styles:', containerStyles);
    
    // Check if overflow is properly set to hidden
    expect(containerStyles.overflow).toBe('hidden');
    
    // Check viewport container styles
    const viewport = page.locator('.xy-flow__viewport').first();
    await expect(viewport).toBeVisible();
    
    const viewportStyles = await viewport.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        transform: computed.transform,
        transformOrigin: computed.transformOrigin,
        position: computed.position,
        width: computed.width,
        height: computed.height,
        zIndex: computed.zIndex,
        pointerEvents: computed.pointerEvents
      };
    });
    
    console.log('Viewport Styles:', viewportStyles);
    
    // Check node container styles
    const nodeContainer = page.locator('.xy-flow__nodes').first();
    await expect(nodeContainer).toBeVisible();
    
    const nodeContainerStyles = await nodeContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        width: computed.width,
        height: computed.height,
        top: computed.top,
        left: computed.left,
        transform: computed.transform,
        transformOrigin: computed.transformOrigin
      };
    });
    
    console.log('Node Container Styles:', nodeContainerStyles);
  });

  test('should test node positioning in top-left corner', async ({ page }) => {
    console.log('🔍 Testing node positioning in top-left corner...');
    
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    // Get initial bounds
    const initialBounds = await node1.boundingBox();
    console.log('Initial node bounds:', initialBounds);
    
    // Drag node to top-left corner
    const targetX = 50;  // Close to top-left
    const targetY = 50;
    
    console.log(`Dragging node to top-left corner: (${targetX}, ${targetY})`);
    
    await node1.hover();
    await page.mouse.down();
    await page.mouse.move(targetX, targetY, { steps: 5 });
    await page.mouse.up();
    
    // Wait for position update
    await page.waitForTimeout(500);
    
    // Check if node is still fully visible
    const finalBounds = await node1.boundingBox();
    console.log('Final node bounds:', finalBounds);
    
    if (finalBounds) {
      const flowContainer = page.locator('.react-flow').first();
      const containerBounds = await flowContainer.boundingBox();
      console.log('Container bounds:', containerBounds);
      
      if (containerBounds) {
        // Check if node is clipped by container boundaries
        const isClippedLeft = finalBounds.x < containerBounds.x;
        const isClippedTop = finalBounds.y < containerBounds.y;
        const isClippedRight = (finalBounds.x + finalBounds.width) > (containerBounds.x + containerBounds.width);
        const isClippedBottom = (finalBounds.y + finalBounds.height) > (containerBounds.y + containerBounds.height);
        
        console.log('Clipping analysis:', {
          isClippedLeft,
          isClippedTop,
          isClippedRight,
          isClippedBottom,
          nodeLeft: finalBounds.x,
          nodeTop: finalBounds.y,
          nodeRight: finalBounds.x + finalBounds.width,
          nodeBottom: finalBounds.y + finalBounds.height,
          containerLeft: containerBounds.x,
          containerTop: containerBounds.y,
          containerRight: containerBounds.x + containerBounds.width,
          containerBottom: containerBounds.y + containerBounds.height
        });
        
        // The node should not be clipped by the container
        if (isClippedLeft || isClippedTop || isClippedRight || isClippedBottom) {
          console.log('❌ Node is being clipped by container boundaries!');
          
          // Check if the issue is with CSS overflow or positioning
          const nodeElement = await node1.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
              computedPosition: computed.position,
              computedZIndex: computed.zIndex,
              computedTransform: computed.transform,
              actualRect: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
              }
            };
          });
          
          console.log('Node element details:', nodeElement);
          
        } else {
          console.log('✅ Node is properly contained within boundaries');
        }
      }
    }
  });

  test('should test extreme positioning cases', async ({ page }) => {
    console.log('🔍 Testing extreme positioning cases...');
    
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    // Test various extreme positions
    const testPositions = [
      { x: 10, y: 10, name: 'very top-left' },
      { x: 10, y: 200, name: 'far left' },
      { x: 200, y: 10, name: 'very top' },
      { x: -50, y: 100, name: 'negative X (outside left)' },
      { x: 100, y: -50, name: 'negative Y (outside top)' },
    ];
    
    for (const pos of testPositions) {
      console.log(`\n🧪 Testing ${pos.name} position: (${pos.x}, ${pos.y})`);
      
      // Drag to position
      await node1.hover();
      await page.mouse.down();
      await page.mouse.move(pos.x, pos.y, { steps: 3 });
      await page.mouse.up();
      
      await page.waitForTimeout(300);
      
      // Check visibility
      const bounds = await node1.boundingBox();
      const isVisible = await node1.isVisible();
      
      console.log(`  📍 Position result:`, {
        bounds,
        isVisible,
        position: pos
      });
      
      // Check if the node content is accessible
      if (isVisible && bounds) {
        const nodeText = await node1.textContent();
        console.log(`  📝 Node text: "${nodeText}"`);
        
        // Try to click the node to see if it's interactive
        try {
          await node1.click({ timeout: 1000 });
          console.log(`  ✅ Node is clickable at ${pos.name} position`);
        } catch (error) {
          console.log(`  ❌ Node is not clickable at ${pos.name} position:`, error.message);
        }
      } else {
        console.log(`  ❌ Node is not visible at ${pos.name} position`);
      }
    }
  });

  test('should compare viewport transforms', async ({ page }) => {
    console.log('🔍 Comparing viewport transforms...');
    
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    // Get initial viewport state
    const initialViewport = await page.evaluate(() => {
      const viewport = document.querySelector('.xy-flow__viewport');
      if (viewport) {
        const computed = window.getComputedStyle(viewport);
        return {
          transform: computed.transform,
          transformOrigin: computed.transformOrigin
        };
      }
      return null;
    });
    
    console.log('Initial viewport transform:', initialViewport);
    
    // Drag a node and see how viewport changes
    await node1.hover();
    await page.mouse.down();
    await page.mouse.move(100, 100, { steps: 3 });
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    
    const finalViewport = await page.evaluate(() => {
      const viewport = document.querySelector('.xy-flow__viewport');
      if (viewport) {
        const computed = window.getComputedStyle(viewport);
        return {
          transform: computed.transform,
          transformOrigin: computed.transformOrigin
        };
      }
      return null;
    });
    
    console.log('Final viewport transform:', finalViewport);
    
    // The viewport transform should remain the same when dragging nodes
    // (nodes move within the viewport, not the viewport itself)
    if (initialViewport && finalViewport) {
      const transformChanged = initialViewport.transform !== finalViewport.transform;
      if (transformChanged) {
        console.log('⚠️  Viewport transform changed during node drag - this might be incorrect');
      } else {
        console.log('✅ Viewport transform remained stable during node drag');
      }
    }
  });

  test('should analyze container hierarchy', async ({ page }) => {
    console.log('🔍 Analyzing container hierarchy...');
    
    // Get the complete hierarchy from flow to node
    const hierarchy = await page.evaluate(() => {
      const node = document.querySelector('[data-id="1"]');
      if (!node) return null;
      
      const path = [];
      let current = node;
      
      while (current && current !== document.body) {
        const computed = window.getComputedStyle(current);
        const rect = current.getBoundingClientRect();
        
        path.push({
          tagName: current.tagName,
          className: current.className,
          id: current.id,
          position: computed.position,
          overflow: computed.overflow,
          zIndex: computed.zIndex,
          transform: computed.transform,
          bounds: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          }
        });
        
        current = current.parentElement;
      }
      
      return path;
    });
    
    console.log('Container hierarchy (node to root):');
    hierarchy?.forEach((container, index) => {
      console.log(`  ${index}: ${container.tagName}.${container.className}`, {
        position: container.position,
        overflow: container.overflow,
        zIndex: container.zIndex,
        bounds: container.bounds,
        transform: container.transform !== 'none' ? container.transform : 'none'
      });
    });
  });
});