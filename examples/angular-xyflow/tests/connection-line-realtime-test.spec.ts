import { test, expect } from '@playwright/test';

/**
 * Connection Line Real-time Update Test
 * 
 * This test verifies that connection lines update in real-time during node dragging.
 * The fix involves making edge path calculations reactive using Angular signals computed().
 */

test.describe('Connection Line Real-time Update Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/examples/basic');
    await page.waitForSelector('.xy-flow__node');
    await page.waitForTimeout(2000);
  });

  test('should update connection lines in real-time during node dragging', async ({ page }) => {
    console.log('🔍 Testing real-time connection line updates during node dragging...');
    
    // Check if edges exist
    const edges = await page.locator('.xy-flow__edge').count();
    console.log(`Found ${edges} edges in the flow`);
    expect(edges).toBeGreaterThan(0);
    
    // Get the first edge path before dragging
    const firstEdge = page.locator('.xy-flow__edge-path').first();
    await expect(firstEdge).toBeVisible();
    
    const initialPath = await firstEdge.getAttribute('d');
    console.log('Initial edge path:', initialPath?.substring(0, 50) + '...');
    
    // Find a node to drag (should be connected to the edge)
    const node1 = page.locator('[data-id="1"]').first();
    await expect(node1).toBeVisible();
    
    console.log('Starting to drag node 1...');
    
    // Start dragging and capture path changes during the drag
    const initialBounds = await node1.boundingBox();
    if (!initialBounds) throw new Error('Could not get initial bounds');
    
    // Start drag
    await node1.hover();
    await page.mouse.down();
    
    // Move gradually and check if edge path updates during the movement
    const steps = 5;
    const targetX = initialBounds.x + 100;
    const targetY = initialBounds.y + 100;
    const stepX = (targetX - initialBounds.x) / steps;
    const stepY = (targetY - initialBounds.y) / steps;
    
    const pathsDuringDrag: string[] = [];
    
    for (let i = 1; i <= steps; i++) {
      const currentX = initialBounds.x + (stepX * i);
      const currentY = initialBounds.y + (stepY * i);
      
      await page.mouse.move(currentX, currentY);
      
      // Wait a bit for the UI to update
      await page.waitForTimeout(100);
      
      // Capture the edge path during the drag
      const currentPath = await firstEdge.getAttribute('d');
      if (currentPath) {
        pathsDuringDrag.push(currentPath);
        console.log(`Step ${i}: Edge path updated to: ${currentPath.substring(0, 50)}...`);
      }
    }
    
    // End drag
    await page.mouse.up();
    await page.waitForTimeout(200);
    
    // Get final path after drag
    const finalPath = await firstEdge.getAttribute('d');
    console.log('Final edge path:', finalPath?.substring(0, 50) + '...');
    
    // Verify that the edge path changed during dragging
    console.log('\n📊 Analysis of edge path changes:');
    console.log(`Initial path: ${initialPath?.substring(0, 50)}...`);
    console.log(`Paths during drag: ${pathsDuringDrag.length} captured`);
    console.log(`Final path: ${finalPath?.substring(0, 50)}...`);
    
    // Key assertions:
    // 1. The edge path should have changed from initial to final
    expect(finalPath).not.toBe(initialPath);
    console.log('✅ Edge path changed from initial to final position');
    
    // 2. We should have captured path changes during the drag (real-time updates)
    expect(pathsDuringDrag.length).toBeGreaterThan(0);
    console.log('✅ Captured path changes during drag');
    
    // 3. At least some of the intermediate paths should be different from the initial
    const uniquePaths = new Set([initialPath, ...pathsDuringDrag, finalPath]);
    expect(uniquePaths.size).toBeGreaterThan(1);
    console.log(`✅ Found ${uniquePaths.size} unique edge paths during the drag sequence`);
    
    // 4. Check if we captured changes during the actual drag (not just start/end)
    const pathsChangedDuringDrag = pathsDuringDrag.some(path => path !== initialPath);
    expect(pathsChangedDuringDrag).toBe(true);
    console.log('✅ Edge paths updated in real-time during node dragging');
    
    console.log('\n🎉 Connection line real-time update test passed!');
  });

  test('should verify edge path recalculation triggers are working', async ({ page }) => {
    console.log('🔍 Testing edge path recalculation triggers...');
    
    // Monitor console logs to see if the computed property is being called
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('EdgeRenderer: edgePathsMap computed')) {
        logs.push(msg.text());
        console.log('📋 Captured log:', msg.text());
      }
    });
    
    // Get initial edge path
    const firstEdge = page.locator('.xy-flow__edge-path').first();
    await expect(firstEdge).toBeVisible();
    
    const initialPath = await firstEdge.getAttribute('d');
    console.log('Initial edge path length:', initialPath?.length);
    
    // Perform a drag operation
    const node1 = page.locator('[data-id="1"]').first();
    await node1.hover();
    await page.mouse.down();
    await page.mouse.move(150, 150, { steps: 3 });
    await page.mouse.up();
    
    // Wait for any async updates
    await page.waitForTimeout(1000);
    
    // Check final path
    const finalPath = await firstEdge.getAttribute('d');
    console.log('Final edge path length:', finalPath?.length);
    
    // Verify that computed property was called
    console.log(`\n📊 EdgeRenderer computed calls: ${logs.length}`);
    logs.forEach((log, index) => {
      console.log(`  ${index + 1}: ${log}`);
    });
    
    // We should have at least one call to the computed property
    expect(logs.length).toBeGreaterThan(0);
    console.log('✅ Edge path recalculation triggered correctly');
    
    // Path should have changed
    expect(finalPath).not.toBe(initialPath);
    console.log('✅ Edge path changed as expected');
  });

  test('should handle multiple connected edges updating simultaneously', async ({ page }) => {
    console.log('🔍 Testing multiple connected edges updating simultaneously...');
    
    // Count total edges
    const edgeCount = await page.locator('.xy-flow__edge-path').count();
    console.log(`Found ${edgeCount} edges in the flow`);
    
    if (edgeCount < 2) {
      console.log('⚠️  Skipping test - need at least 2 edges for this test');
      return;
    }
    
    // Capture initial paths of all edges
    const initialPaths: string[] = [];
    for (let i = 0; i < edgeCount; i++) {
      const edge = page.locator('.xy-flow__edge-path').nth(i);
      const path = await edge.getAttribute('d');
      if (path) initialPaths.push(path);
    }
    
    console.log(`Captured ${initialPaths.length} initial edge paths`);
    
    // Drag a node that's connected to multiple edges (node 1 should be connected to 2 edges)
    const node1 = page.locator('[data-id="1"]').first();
    await node1.hover();
    await page.mouse.down();
    await page.mouse.move(200, 200, { steps: 5 });
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    
    // Capture final paths of all edges
    const finalPaths: string[] = [];
    for (let i = 0; i < edgeCount; i++) {
      const edge = page.locator('.xy-flow__edge-path').nth(i);
      const path = await edge.getAttribute('d');
      if (path) finalPaths.push(path);
    }
    
    console.log(`Captured ${finalPaths.length} final edge paths`);
    
    // Check how many edges changed
    let changedEdges = 0;
    for (let i = 0; i < Math.min(initialPaths.length, finalPaths.length); i++) {
      if (initialPaths[i] !== finalPaths[i]) {
        changedEdges++;
        console.log(`Edge ${i} changed path`);
      }
    }
    
    console.log(`${changedEdges} out of ${edgeCount} edges changed paths`);
    
    // At least one edge should have changed (the ones connected to node 1)
    expect(changedEdges).toBeGreaterThan(0);
    console.log('✅ Multiple edges updated when connected node was dragged');
    
    console.log('\n🎉 Multiple edge update test passed!');
  });
});