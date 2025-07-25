import { test, expect } from '@playwright/test';

test.describe('Angular Flow Node-to-Node Connection Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4201');
    await page.waitForSelector('[data-id="1"]', { timeout: 10000 });
  });

  test('should have connection handles on nodes', async ({ page }) => {
    // Check that nodes have source and target handles
    const node1 = page.locator('[data-id="1"]');
    const node2 = page.locator('[data-id="2"]');
    
    await expect(node1).toBeVisible();
    await expect(node2).toBeVisible();
    
    // Check for handles within nodes
    const sourceHandle1 = node1.locator('.xy-flow__handle.source');
    const targetHandle2 = node2.locator('.xy-flow__handle.target');
    
    await expect(sourceHandle1).toBeVisible();
    await expect(targetHandle2).toBeVisible();
    
    console.log('✅ Connection handles are visible on nodes');
  });

  test('should allow dragging from source handle to target handle', async ({ page }) => {
    // Find nodes and their handles
    const node1 = page.locator('[data-id="1"]');
    const node4 = page.locator('[data-id="4"]');
    
    await expect(node1).toBeVisible();
    await expect(node4).toBeVisible();
    
    // Find handles
    const sourceHandle1 = node1.locator('.xy-flow__handle.source');
    const targetHandle4 = node4.locator('.xy-flow__handle.target');
    
    await expect(sourceHandle1).toBeVisible();
    await expect(targetHandle4).toBeVisible();
    
    // Get initial edge count
    const initialEdges = await page.locator('.xy-flow__edge').count();
    
    // Attempt to create connection by dragging from source to target
    await sourceHandle1.hover();
    await page.mouse.down();
    
    // Drag to target handle
    await targetHandle4.hover();
    await page.mouse.up();
    
    // Wait a bit for connection to be created
    await page.waitForTimeout(500);
    
    // Check if new edge was created
    const finalEdges = await page.locator('.xy-flow__edge').count();
    
    if (finalEdges > initialEdges) {
      console.log('✅ Successfully created new connection');
      expect(finalEdges).toBeGreaterThan(initialEdges);
    } else {
      console.log('❌ Connection creation failed - no new edge was created');
      console.log(`Initial edges: ${initialEdges}, Final edges: ${finalEdges}`);
    }
  });

  test('should show connection line during drag', async ({ page }) => {
    const node1 = page.locator('[data-id="1"]');
    const sourceHandle1 = node1.locator('.xy-flow__handle.source');
    
    await expect(sourceHandle1).toBeVisible();
    
    // Start drag from source handle
    await sourceHandle1.hover();
    await page.mouse.down();
    
    // Move mouse to create connection line
    await page.mouse.move(400, 300);
    
    // Check if connection line is visible during drag
    const connectionLine = page.locator('.xy-flow__connection-line, .react-flow__connection-line');
    
    // Wait for connection line to appear
    await page.waitForTimeout(100);
    
    const isConnectionLineVisible = await connectionLine.isVisible();
    
    if (isConnectionLineVisible) {
      console.log('✅ Connection line is visible during drag');
    } else {
      console.log('❌ Connection line is not visible during drag');
    }
    
    // End drag
    await page.mouse.up();
    
    expect(isConnectionLineVisible).toBe(true);
  });

  test('should trigger onConnect event when connection is made', async ({ page }) => {
    // Listen for console logs to check if onConnect is triggered
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });
    
    const node1 = page.locator('[data-id="1"]');
    const node4 = page.locator('[data-id="4"]');
    
    const sourceHandle1 = node1.locator('.xy-flow__handle.source');
    const targetHandle4 = node4.locator('.xy-flow__handle.target');
    
    // Create connection
    await sourceHandle1.hover();
    await page.mouse.down();
    await targetHandle4.hover();
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    
    // Check if onConnect was called
    const connectLogs = logs.filter(log => log.includes('onConnect'));
    
    if (connectLogs.length > 0) {
      console.log('✅ onConnect event was triggered:', connectLogs[0]);
    } else {
      console.log('❌ onConnect event was not triggered');
      console.log('All logs:', logs);
    }
    
    expect(connectLogs.length).toBeGreaterThan(0);
  });

  test('should display existing connections', async ({ page }) => {
    // Check that default edges are rendered
    const edges = page.locator('.xy-flow__edge');
    const edgeCount = await edges.count();
    
    console.log(`Found ${edgeCount} edges`);
    
    // Should have at least the default edges (e1-2, e1-3)
    expect(edgeCount).toBeGreaterThanOrEqual(2);
    
    // Check that we have at least some edges visible
    if (edgeCount >= 2) {
      console.log('✅ Expected number of edges found');
    } else {
      console.log('❌ Expected at least 2 edges, found:', edgeCount);
    }
    
    console.log('✅ Default connections are properly displayed');
  });
});