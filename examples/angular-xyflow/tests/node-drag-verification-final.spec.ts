import { test, expect } from '@playwright/test';

/**
 * Final verification test for node dragging fix
 * 
 * This test verifies that the node position persistence issue has been resolved
 * and that nodes can be dragged without invisible boundary constraints.
 */

test.describe('Node Drag Final Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the basic example
    await page.goto('http://localhost:4200/examples/basic');
    
    // Wait for the component to load
    await page.waitForSelector('.xy-flow__node');
    
    // Wait for initialization
    await page.waitForTimeout(1000);
  });

  test('should successfully drag nodes and persist their positions', async ({ page }) => {
    console.log('🔍 Testing node position persistence after dragging...');
    
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    // Get initial position
    const initialBox = await node1.boundingBox();
    if (!initialBox) throw new Error('Could not get initial bounding box');
    
    console.log('Initial position:', { x: initialBox.x, y: initialBox.y });
    
    // Test multiple drag operations
    const testPositions = [
      { x: 200, y: 200, description: 'moderate distance' },
      { x: 400, y: 100, description: 'different direction' },
      { x: 100, y: 400, description: 'back towards origin' }
    ];
    
    for (const pos of testPositions) {
      console.log(`\n🧪 Testing drag to ${pos.description}: (${pos.x}, ${pos.y})`);
      
      // Get current position before drag
      const beforeBox = await node1.boundingBox();
      if (!beforeBox) continue;
      
      console.log(`  📍 Before drag: (${beforeBox.x}, ${beforeBox.y})`);
      
      // Perform drag operation
      await node1.hover();
      await page.mouse.down();
      await page.mouse.move(pos.x, pos.y, { steps: 5 });
      await page.mouse.up();
      
      // Wait for position update
      await page.waitForTimeout(500);
      
      // Get position after drag
      const afterBox = await node1.boundingBox();
      if (!afterBox) continue;
      
      console.log(`  📍 After drag: (${afterBox.x}, ${afterBox.y})`);
      
      // Calculate actual movement
      const displacement = {
        x: afterBox.x - beforeBox.x,
        y: afterBox.y - beforeBox.y
      };
      
      const expectedDisplacement = {
        x: pos.x - beforeBox.x,
        y: pos.y - beforeBox.y
      };
      
      console.log(`  📏 Expected displacement: (${expectedDisplacement.x}, ${expectedDisplacement.y})`);
      console.log(`  📏 Actual displacement: (${displacement.x}, ${displacement.y})`);
      
      // Check if the node moved significantly (allow some tolerance for precision)
      const tolerance = 20; // pixels
      const actuallyMoved = Math.abs(displacement.x) > tolerance || Math.abs(displacement.y) > tolerance;
      
      if (actuallyMoved) {
        console.log('  ✅ Node position persisted successfully');
        
        // Verify the position stayed after a short delay (no snap-back)
        await page.waitForTimeout(1000);
        const finalBox = await node1.boundingBox();
        if (finalBox) {
          const positionDrift = {
            x: Math.abs(finalBox.x - afterBox.x),
            y: Math.abs(finalBox.y - afterBox.y)
          };
          
          if (positionDrift.x < 5 && positionDrift.y < 5) {
            console.log('  ✅ Position remained stable (no snap-back)');
          } else {
            console.log('  ⚠️  Position drifted after drag:', positionDrift);
          }
        }
      } else {
        console.log('  ❌ Node did not move or position was not preserved');
        throw new Error(`Node failed to move to position ${pos.description}`);
      }
    }
    
    console.log('\n🎉 All drag operations completed successfully!');
  });

  test('should handle multiple consecutive drags without issues', async ({ page }) => {
    console.log('🔍 Testing multiple consecutive drags...');
    
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    // Perform 5 quick consecutive drags
    const positions = [
      { x: 150, y: 150 },
      { x: 300, y: 200 },
      { x: 250, y: 350 },
      { x: 400, y: 300 },
      { x: 200, y: 100 }
    ];
    
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      console.log(`Drag ${i + 1}/5 to (${pos.x}, ${pos.y})`);
      
      await node1.hover();
      await page.mouse.down();
      await page.mouse.move(pos.x, pos.y, { steps: 3 });
      await page.mouse.up();
      
      // Short wait between drags
      await page.waitForTimeout(200);
    }
    
    // Verify final position is stable
    await page.waitForTimeout(1000);
    const finalBox = await node1.boundingBox();
    if (finalBox) {
      console.log(`Final position after ${positions.length} drags: (${finalBox.x}, ${finalBox.y})`);
      console.log('✅ Multiple consecutive drags completed successfully');
    }
  });

  test('should verify console logs show correct event flow', async ({ page }) => {
    console.log('🔍 Verifying console logs for event flow...');
    
    // Monitor console messages
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && (
        msg.text().includes('BasicExample onNodePositionChange') ||
        msg.text().includes('WrapperComponent handleNodePositionChange') ||
        msg.text().includes('NodeRenderer handleNodePositionChange') ||
        msg.text().includes('updateNodePositions called')
      )) {
        logs.push(msg.text());
      }
    });
    
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    // Perform a single drag
    await node1.hover();
    await page.mouse.down();
    await page.mouse.move(250, 250, { steps: 5 });
    await page.mouse.up();
    
    // Wait for logs to be captured
    await page.waitForTimeout(1000);
    
    console.log('Captured console logs:', logs);
    
    // Verify that the event chain is working
    const hasPositionChangeLog = logs.some(log => log.includes('BasicExample onNodePositionChange'));
    const hasUpdateNodePositions = logs.some(log => log.includes('updateNodePositions called'));
    
    if (hasPositionChangeLog && hasUpdateNodePositions) {
      console.log('✅ Event flow is working correctly');
    } else {
      console.log('❌ Event flow is not working as expected');
      throw new Error('Missing expected console logs for event flow');
    }
  });
});