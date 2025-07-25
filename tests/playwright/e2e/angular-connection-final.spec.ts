import { test, expect } from '@playwright/test';

test.describe('Angular Flow Connection Final Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForSelector('[data-id="1"]', { timeout: 10000 });
  });

  test('should create new edge and verify it appears in UI', async ({ page }) => {
    // Count initial edges
    const initialEdges = await page.locator('.xy-flow__edge').count();
    console.log('Initial edge count:', initialEdges);
    
    // Get nodes and handles
    const node1 = page.locator('[data-id="1"]');
    const node4 = page.locator('[data-id="4"]');
    
    const sourceHandle1 = node1.locator('.xy-flow__handle.source');
    const targetHandle4 = node4.locator('.xy-flow__handle.target');
    
    // Create connection
    await sourceHandle1.hover();
    await page.mouse.down();
    await targetHandle4.hover();
    await page.mouse.up();
    
    // Wait for edge to be created
    await page.waitForTimeout(1000);
    
    // Count final edges
    const finalEdges = await page.locator('.xy-flow__edge').count();
    console.log('Final edge count:', finalEdges);
    
    // Verify new edge was created
    expect(finalEdges).toBeGreaterThan(initialEdges);
    
    console.log('✅ Successfully created new connection! Edge count increased from', initialEdges, 'to', finalEdges);
  });

  test('should verify multiple connections can be created', async ({ page }) => {
    const initialEdges = await page.locator('.xy-flow__edge').count();
    
    // Create first connection: Node 1 → Node 4
    const node1 = page.locator('[data-id="1"]');
    const node4 = page.locator('[data-id="4"]');
    
    await node1.locator('.xy-flow__handle.source').hover();
    await page.mouse.down();
    await node4.locator('.xy-flow__handle.target').hover();
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    const afterFirstConnection = await page.locator('.xy-flow__edge').count();
    
    // Create second connection: Node 2 → Node 4  
    const node2 = page.locator('[data-id="2"]');
    
    await node2.locator('.xy-flow__handle.source').hover();
    await page.mouse.down();
    await node4.locator('.xy-flow__handle.target').hover();
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    const finalEdges = await page.locator('.xy-flow__edge').count();
    
    console.log('Edge progression:', initialEdges, '→', afterFirstConnection, '→', finalEdges);
    
    // Should have created 2 new edges
    expect(finalEdges).toBe(initialEdges + 2);
    
    console.log('✅ Successfully created multiple connections!');
  });

  test('should verify React-Angular parity - both should work the same', async ({ page }) => {
    // This test verifies that Angular Flow connection functionality 
    // matches React Flow as requested by the user
    
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });

    // Test connection functionality
    const node1 = page.locator('[data-id="1"]');
    const node3 = page.locator('[data-id="3"]');
    
    await node1.locator('.xy-flow__handle.source').hover();
    await page.mouse.down();
    await node3.locator('.xy-flow__handle.target').hover();
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    
    // Verify onConnect event was logged (matching React Flow behavior)
    const connectLogs = logs.filter(log => log.includes('onConnect'));
    expect(connectLogs.length).toBeGreaterThan(0);
    
    // Verify connection data format matches expectations
    const connectLog = connectLogs[0];
    expect(connectLog).toContain('source: 1');
    expect(connectLog).toContain('target: 3');
    expect(connectLog).toContain('sourceHandle: source');
    expect(connectLog).toContain('targetHandle: target');
    
    console.log('✅ Angular Flow connection events match React Flow format!');
    console.log('Connection event:', connectLog);
  });
});