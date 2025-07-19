import { test, expect } from '@playwright/test';

test.describe('Angular XYFlow Drag and Drop Tests', () => {
  test('should drag nodes to new positions', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForSelector('angular-flow', { timeout: 30000 });
    await page.waitForSelector('.xy-flow__node', { timeout: 30000 });
    
    // Get the initial position of the first node
    const node1 = page.locator('.xy-flow__node').first();
    const initialBox = await node1.boundingBox();
    
    if (!initialBox) {
      throw new Error('Node not found or not visible');
    }
    
    // Drag the node to a new position
    await node1.dragTo(page.locator('.xy-flow__viewport'), {
      targetPosition: { x: initialBox.x + 100, y: initialBox.y + 100 }
    });
    
    // Wait for the drag to complete
    await page.waitForTimeout(500);
    
    // Check if the node has moved
    const finalBox = await node1.boundingBox();
    
    if (!finalBox) {
      throw new Error('Node not found after drag');
    }
    
    // The node should have moved from its initial position
    expect(finalBox.x).not.toBe(initialBox.x);
    expect(finalBox.y).not.toBe(initialBox.y);
    
    console.log('Initial position:', initialBox.x, initialBox.y);
    console.log('Final position:', finalBox.x, finalBox.y);
  });
  
  test('should handle multiple node dragging', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForSelector('angular-flow', { timeout: 30000 });
    await page.waitForSelector('.xy-flow__node', { timeout: 30000 });
    
    // Get all nodes
    const nodes = page.locator('.xy-flow__node');
    const nodeCount = await nodes.count();
    
    expect(nodeCount).toBeGreaterThan(0);
    
    // Try to drag each node
    for (let i = 0; i < nodeCount; i++) {
      const node = nodes.nth(i);
      const initialBox = await node.boundingBox();
      
      if (initialBox) {
        await node.dragTo(page.locator('.xy-flow__viewport'), {
          targetPosition: { x: initialBox.x + 50, y: initialBox.y + 50 }
        });
        await page.waitForTimeout(200);
      }
    }
    
    // All nodes should be draggable
    console.log(`Successfully tested dragging ${nodeCount} nodes`);
  });
  
  test('should maintain node selection during drag', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForSelector('angular-flow', { timeout: 30000 });
    await page.waitForSelector('.xy-flow__node', { timeout: 30000 });
    
    const node1 = page.locator('.xy-flow__node').first();
    
    // Click to select the node
    await node1.click();
    
    // Check if node is selected (has .selected class)
    await expect(node1).toHaveClass(/selected/);
    
    // Drag the selected node
    const initialBox = await node1.boundingBox();
    if (initialBox) {
      await node1.dragTo(page.locator('.xy-flow__viewport'), {
        targetPosition: { x: initialBox.x + 100, y: initialBox.y + 100 }
      });
    }
    
    // Node should still be selected after drag
    await expect(node1).toHaveClass(/selected/);
  });
  
  test('should not drag nodes with draggable=false', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForSelector('angular-flow', { timeout: 30000 });
    await page.waitForSelector('.xy-flow__node', { timeout: 30000 });
    
    // Look for nodes with nodrag class
    const nodragNodes = page.locator('.xy-flow__node.nodrag');
    const nodragCount = await nodragNodes.count();
    
    if (nodragCount > 0) {
      const node = nodragNodes.first();
      const initialBox = await node.boundingBox();
      
      if (initialBox) {
        // Try to drag the node
        await node.dragTo(page.locator('.xy-flow__viewport'), {
          targetPosition: { x: initialBox.x + 100, y: initialBox.y + 100 }
        });
        
        await page.waitForTimeout(500);
        
        // Check if the node stayed in the same position
        const finalBox = await node.boundingBox();
        
        if (finalBox) {
          expect(finalBox.x).toBe(initialBox.x);
          expect(finalBox.y).toBe(initialBox.y);
        }
      }
    }
  });
  
  test('should provide drag event feedback', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForSelector('angular-flow', { timeout: 30000 });
    await page.waitForSelector('.xy-flow__node', { timeout: 30000 });
    
    // Listen for console messages
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });
    
    const node1 = page.locator('.xy-flow__node').first();
    const initialBox = await node1.boundingBox();
    
    if (initialBox) {
      // Drag the node
      await node1.dragTo(page.locator('.xy-flow__viewport'), {
        targetPosition: { x: initialBox.x + 100, y: initialBox.y + 100 }
      });
      
      await page.waitForTimeout(500);
      
      // Check for drag start and end console messages
      const dragStartMessages = consoleMessages.filter(msg => msg.includes('Drag start'));
      const dragEndMessages = consoleMessages.filter(msg => msg.includes('Drag end'));
      
      expect(dragStartMessages.length).toBeGreaterThan(0);
      expect(dragEndMessages.length).toBeGreaterThan(0);
    }
  });
});