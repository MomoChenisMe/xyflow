import { test, expect } from '@playwright/test';

/**
 * Node Drag Range Investigation Test
 * 
 * This test investigates the boundary constraints issue where nodes
 * are being limited to an invisible dragging range.
 */

test.describe('Node Drag Range Investigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the basic example
    await page.goto('http://localhost:4200/examples/basic');
    
    // Wait for the component to load
    await page.waitForSelector('.xy-flow__node');
    
    // Wait for initialization
    await page.waitForTimeout(1000);
  });

  test('should investigate node dragging boundaries', async ({ page }) => {
    console.log('🔍 Starting node drag range investigation...');
    
    // Get initial node position
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    const initialBoundingBox = await node1.boundingBox();
    console.log('Initial node position:', initialBoundingBox);
    
    // Test 1: Try dragging node to various positions
    const testPositions = [
      { x: 100, y: 100, description: 'small displacement' },
      { x: 500, y: 300, description: 'medium displacement' },
      { x: 1000, y: 600, description: 'large displacement' },
      { x: 1500, y: 900, description: 'very large displacement' },
      { x: -200, y: -100, description: 'negative position' },
      { x: 2000, y: 1200, description: 'extreme position' }
    ];
    
    for (const testPos of testPositions) {
      console.log(`\n🧪 Testing drag to ${testPos.description}: (${testPos.x}, ${testPos.y})`);
      
      // Get current position
      const currentBox = await node1.boundingBox();
      if (!currentBox) continue;
      
      // Calculate drag distance
      const dragDistance = {
        x: testPos.x - currentBox.x,
        y: testPos.y - currentBox.y
      };
      
      console.log(`  📏 Drag distance: (${dragDistance.x}, ${dragDistance.y})`);
      
      // Perform drag
      await node1.hover();
      await page.mouse.down();
      await page.mouse.move(testPos.x, testPos.y, { steps: 10 });
      await page.mouse.up();
      
      // Wait for position update
      await page.waitForTimeout(500);
      
      // Get final position
      const finalBox = await node1.boundingBox();
      if (!finalBox) continue;
      
      const actualDistance = {
        x: finalBox.x - currentBox.x,
        y: finalBox.y - currentBox.y
      };
      
      console.log(`  📍 Actual displacement: (${actualDistance.x}, ${actualDistance.y})`);
      console.log(`  🎯 Expected displacement: (${dragDistance.x}, ${dragDistance.y})`);
      
      // Check if the node moved as expected
      const tolerance = 10; // pixels
      const xConstraint = Math.abs(actualDistance.x - dragDistance.x) > tolerance;
      const yConstraint = Math.abs(actualDistance.y - dragDistance.y) > tolerance;
      
      if (xConstraint || yConstraint) {
        console.log(`  ⚠️  Movement was constrained! Expected vs Actual difference:`);
        console.log(`     X: ${Math.abs(actualDistance.x - dragDistance.x)} pixels`);
        console.log(`     Y: ${Math.abs(actualDistance.y - dragDistance.y)} pixels`);
      } else {
        console.log(`  ✅ Movement was unconstrained`);
      }
      
      // Log console messages from the browser
      page.on('console', msg => {
        if (msg.type() === 'log' && msg.text().includes('updateNodePositions')) {
          console.log(`  🔍 Browser log: ${msg.text()}`);
        }
      });
    }
  });

  test('should check viewport and container boundaries', async ({ page }) => {
    console.log('🔍 Investigating viewport and container boundaries...');
    
    // Get container dimensions
    const flowContainer = page.locator('.react-flow').first();
    await expect(flowContainer).toBeVisible();
    
    const containerBox = await flowContainer.boundingBox();
    console.log('Flow container dimensions:', containerBox);
    
    // Get viewport info from the browser
    const viewportInfo = await page.evaluate(() => {
      const container = document.querySelector('.react-flow');
      if (!container) return null;
      
      return {
        containerWidth: container.clientWidth,
        containerHeight: container.clientHeight,
        containerOffsetLeft: container.offsetLeft,
        containerOffsetTop: container.offsetTop,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      };
    });
    
    console.log('Viewport info:', viewportInfo);
    
    // Check for any CSS overflow constraints
    const containerStyles = await page.evaluate(() => {
      const container = document.querySelector('.react-flow');
      if (!container) return null;
      
      const styles = window.getComputedStyle(container);
      return {
        overflow: styles.overflow,
        overflowX: styles.overflowX,
        overflowY: styles.overflowY,
        position: styles.position,
        width: styles.width,
        height: styles.height,
        transform: styles.transform
      };
    });
    
    console.log('Container CSS styles:', containerStyles);
  });

  test('should analyze XYDrag configuration', async ({ page }) => {
    console.log('🔍 Analyzing XYDrag configuration...');
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log(`Browser: ${msg.text()}`);
      }
    });
    
    // Get a node and try to drag it while monitoring console output
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    console.log('Starting drag to monitor XYDrag behavior...');
    
    await node1.hover();
    await page.mouse.down();
    
    // Move in increments to see detailed logging
    for (let i = 0; i < 5; i++) {
      await page.mouse.move(200 + i * 100, 200 + i * 50, { steps: 5 });
      await page.waitForTimeout(200);
    }
    
    await page.mouse.up();
    await page.waitForTimeout(1000);
    
    console.log('Drag completed. Check browser logs above for XYDrag behavior.');
  });

  test('should test extreme drag positions', async ({ page }) => {
    console.log('🔍 Testing extreme drag positions to find boundaries...');
    
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    // Test dragging to extreme positions
    const extremePositions = [
      { x: -1000, y: -1000, description: 'far negative' },
      { x: 3000, y: 2000, description: 'far positive' },
      { x: -500, y: 1500, description: 'mixed extreme' },
      { x: 0, y: 0, description: 'origin' }
    ];
    
    for (const pos of extremePositions) {
      console.log(`\n🚀 Testing extreme position ${pos.description}: (${pos.x}, ${pos.y})`);
      
      const beforeBox = await node1.boundingBox();
      if (!beforeBox) continue;
      
      // Drag to extreme position
      await node1.hover();
      await page.mouse.down();
      await page.mouse.move(pos.x, pos.y, { steps: 20 });
      await page.mouse.up();
      
      await page.waitForTimeout(500);
      
      const afterBox = await node1.boundingBox();
      if (!afterBox) continue;
      
      const displacement = {
        x: afterBox.x - beforeBox.x,
        y: afterBox.y - beforeBox.y
      };
      
      console.log(`  📍 Actual displacement: (${displacement.x}, ${displacement.y})`);
      console.log(`  📍 Final position: (${afterBox.x}, ${afterBox.y})`);
      
      // Check if position is clamped
      if (Math.abs(afterBox.x - pos.x) > 50 || Math.abs(afterBox.y - pos.y) > 50) {
        console.log(`  ⚠️  Position was clamped/constrained`);
      } else {
        console.log(`  ✅ Position was unconstrained`);
      }
    }
  });
});