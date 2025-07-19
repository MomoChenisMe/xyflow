import { test, expect } from '@playwright/test';

test.describe('Interactive Angular Flow Tests', () => {
  test('should load the interactive Angular Flow app', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForSelector('h1');
    
    // Check if the title is visible
    await expect(page.locator('h1')).toContainText('Angular XY Flow - 互動測試');
    
    // Check if the angular-flow-simple component is visible
    await expect(page.locator('angular-flow-simple')).toBeVisible();
    
    // Check if the debug info shows more details
    await expect(page.locator('.debug-info')).toContainText('Nodes: 2');
    await expect(page.locator('.debug-info')).toContainText('Edges: 1');
    await expect(page.locator('.debug-info')).toContainText('Selected: 0');
    await expect(page.locator('.debug-info')).toContainText('Zoom: 1.00');
    
    console.log('✅ Interactive Angular Flow app loaded successfully!');
  });
  
  test('should select nodes on click', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the flow component to load
    await page.waitForSelector('angular-flow-simple');
    
    // Click on the first node
    await page.locator('.xy-flow__node').first().click();
    
    // Wait for selection to update
    await page.waitForTimeout(100);
    
    // Check if the node is selected (debug info should show Selected: 1)
    await expect(page.locator('.debug-info')).toContainText('Selected: 1');
    
    // Check if the node has selected styling
    await expect(page.locator('.xy-flow__node').first()).toHaveClass(/selected/);
    
    console.log('✅ Node selection works!');
  });
  
  test('should drag nodes to new positions', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the flow component to load
    await page.waitForSelector('angular-flow-simple');
    
    // Get the first node
    const firstNode = page.locator('.xy-flow__node').first();
    
    // Get initial position
    const initialBox = await firstNode.boundingBox();
    
    if (initialBox) {
      // Drag the node to a new position
      await firstNode.dragTo(page.locator('.xy-flow__viewport'), {
        targetPosition: { x: initialBox.x + 100, y: initialBox.y + 100 }
      });
      
      // Wait for drag to complete
      await page.waitForTimeout(500);
      
      // Check if node position changed
      const finalBox = await firstNode.boundingBox();
      
      if (finalBox) {
        // The node should have moved
        const moved = Math.abs(finalBox.x - initialBox.x) > 50 || Math.abs(finalBox.y - initialBox.y) > 50;
        expect(moved).toBe(true);
        
        console.log('✅ Node dragging works!');
        console.log(`Moved from (${initialBox.x}, ${initialBox.y}) to (${finalBox.x}, ${finalBox.y})`);
      }
    }
  });
  
  test('should handle viewport panning', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the flow component to load
    await page.waitForSelector('angular-flow-simple');
    
    // Get the viewport element
    const viewport = page.locator('.xy-flow__viewport');
    const container = page.locator('.xy-flow');
    
    // Get initial viewport position
    const initialTransform = await viewport.getAttribute('style');
    
    // Drag on empty space to pan
    await container.dragTo(container, {
      sourcePosition: { x: 300, y: 300 },
      targetPosition: { x: 400, y: 400 }
    });
    
    // Wait for pan to complete
    await page.waitForTimeout(500);
    
    // Check if viewport position changed
    const finalTransform = await viewport.getAttribute('style');
    
    expect(finalTransform).not.toBe(initialTransform);
    
    console.log('✅ Viewport panning works!');
    console.log(`Transform changed from "${initialTransform}" to "${finalTransform}"`);
  });
  
  test('should handle zoom with mouse wheel', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the flow component to load
    await page.waitForSelector('angular-flow-simple');
    
    // Check initial zoom level
    await expect(page.locator('.debug-info')).toContainText('Zoom: 1.00');
    
    // Zoom in by scrolling up
    await page.locator('.xy-flow').hover();
    await page.mouse.wheel(0, -100);
    
    // Wait for zoom to update
    await page.waitForTimeout(100);
    
    // Check if zoom level increased
    const debugText = await page.locator('.debug-info').textContent();
    const zoomMatch = debugText?.match(/Zoom: ([\d.]+)/);
    
    if (zoomMatch) {
      const zoomLevel = parseFloat(zoomMatch[1]);
      expect(zoomLevel).toBeGreaterThan(1.0);
      
      console.log('✅ Mouse wheel zoom works!');
      console.log(`Zoom level: ${zoomLevel}`);
    }
  });
  
  test('should clear selection when clicking on empty space', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the flow component to load
    await page.waitForSelector('angular-flow-simple');
    
    // First select a node
    await page.locator('.xy-flow__node').first().click();
    await expect(page.locator('.debug-info')).toContainText('Selected: 1');
    
    // Click on empty space
    await page.locator('.xy-flow').click({ position: { x: 400, y: 400 } });
    
    // Wait for selection to clear
    await page.waitForTimeout(100);
    
    // Check if selection is cleared
    await expect(page.locator('.debug-info')).toContainText('Selected: 0');
    
    console.log('✅ Selection clearing works!');
  });
  
  test('should show edges connecting nodes', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the flow component to load
    await page.waitForSelector('angular-flow-simple');
    
    // Check if edges are rendered
    await expect(page.locator('.xy-flow__edge')).toHaveCount(1);
    
    // Check if edge connects the nodes
    const edge = page.locator('.xy-flow__edge').first();
    const x1 = await edge.getAttribute('x1');
    const y1 = await edge.getAttribute('y1');
    const x2 = await edge.getAttribute('x2');
    const y2 = await edge.getAttribute('y2');
    
    // Edge should have valid coordinates
    expect(parseFloat(x1!)).toBeGreaterThan(0);
    expect(parseFloat(y1!)).toBeGreaterThan(0);
    expect(parseFloat(x2!)).toBeGreaterThan(0);
    expect(parseFloat(y2!)).toBeGreaterThan(0);
    
    console.log('✅ Edges render correctly!');
    console.log(`Edge connects (${x1}, ${y1}) to (${x2}, ${y2})`);
  });
});