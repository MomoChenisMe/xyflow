import { test, expect } from '@playwright/test';

test.describe('Angular Flow Connection Debug Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForSelector('[data-id="1"]', { timeout: 10000 });
  });

  test('should debug connection events step by step', async ({ page }) => {
    // Listen for all console logs
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });

    // Find nodes and handles
    const node1 = page.locator('[data-id="1"]');
    const node2 = page.locator('[data-id="2"]');
    
    await expect(node1).toBeVisible();
    await expect(node2).toBeVisible();
    
    // Check handle attributes
    const sourceHandle1 = node1.locator('.xy-flow__handle.source');
    const targetHandle2 = node2.locator('.xy-flow__handle.target');
    
    await expect(sourceHandle1).toBeVisible();
    await expect(targetHandle2).toBeVisible();
    
    // Check data-nodeid attributes
    const sourceNodeId = await sourceHandle1.getAttribute('data-nodeid');
    const targetNodeId = await targetHandle2.getAttribute('data-nodeid');
    
    console.log('Source handle node ID:', sourceNodeId);
    console.log('Target handle node ID:', targetNodeId);
    
    expect(sourceNodeId).toBe('1');
    expect(targetNodeId).toBe('2');
    
    // Test mouse down on source handle
    console.log('Testing mouse down on source handle...');
    await sourceHandle1.hover();
    await page.mouse.down();
    
    // Wait a bit and check if connection state changed
    await page.waitForTimeout(200);
    
    // Check if connection line appeared
    const connectionLine = page.locator('.xy-flow__connection-line, .react-flow__connection-line');
    const isConnectionLineVisible = await connectionLine.isVisible();
    console.log('Connection line visible after mousedown:', isConnectionLineVisible);
    
    // Move to target handle
    console.log('Moving to target handle...');
    await targetHandle2.hover();
    await page.waitForTimeout(100);
    
    // Mouse up on target handle  
    console.log('Mouse up on target handle...');
    await page.mouse.up();
    
    // Wait for events to process
    await page.waitForTimeout(500);
    
    console.log('All console logs:', logs);
    
    // Check for specific event logs
    const connectionStartLogs = logs.filter(log => log.includes('onConnectionStart') || log.includes('connection start'));
    const connectionEndLogs = logs.filter(log => log.includes('onConnectionEnd') || log.includes('connection end'));
    const connectLogs = logs.filter(log => log.includes('onConnect'));
    
    console.log('Connection start logs:', connectionStartLogs);
    console.log('Connection end logs:', connectionEndLogs);
    console.log('Connect logs:', connectLogs);
    
    // At minimum, we should see the connection line during drag
    expect(isConnectionLineVisible).toBe(true);
  });

  test('should check handle click directly', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });

    const node1 = page.locator('[data-id="1"]');
    const sourceHandle1 = node1.locator('.xy-flow__handle.source');
    
    // Direct click on source handle
    await sourceHandle1.click();
    await page.waitForTimeout(100);
    
    console.log('Direct handle click logs:', logs);
  });
});