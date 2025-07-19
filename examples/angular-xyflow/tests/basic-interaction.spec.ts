import { test, expect } from '@playwright/test';

test.describe('Basic Interaction Tests', () => {
  test('should load app and show correct debug info', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForSelector('h1');
    
    // Check if the title is visible
    await expect(page.locator('h1')).toContainText('Angular XY Flow - 互動測試');
    
    // Check if the debug info shows correct initial state
    await expect(page.locator('.debug-info')).toContainText('Nodes: 2');
    await expect(page.locator('.debug-info')).toContainText('Edges: 1');
    await expect(page.locator('.debug-info')).toContainText('Selected: 0');
    await expect(page.locator('.debug-info')).toContainText('Zoom: 1.00');
    
    console.log('✅ App loaded with correct debug info!');
  });
  
  test('should handle node click with console logging', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the flow component to load
    await page.waitForSelector('angular-flow-simple');
    
    // Listen for console messages
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });
    
    // Click on the first node
    await page.locator('.xy-flow__node').first().click();
    
    // Wait for events to process
    await page.waitForTimeout(500);
    
    // Check if console messages were logged
    const nodeClickMessages = consoleMessages.filter(msg => msg.includes('Node clicked:'));
    const selectMessages = consoleMessages.filter(msg => msg.includes('Selecting node:'));
    
    expect(nodeClickMessages.length).toBeGreaterThan(0);
    expect(selectMessages.length).toBeGreaterThan(0);
    
    console.log('✅ Node click logged correctly!');
    console.log('Console messages:', consoleMessages);
  });
  
  test('should show visual feedback for node selection', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the flow component to load
    await page.waitForSelector('angular-flow-simple');
    
    const firstNode = page.locator('.xy-flow__node').first();
    
    // Check initial state - debug info should show 0 selected
    await expect(page.locator('.debug-info')).toContainText('Selected: 0');
    
    // Click on the node
    await firstNode.click();
    await page.waitForTimeout(300);
    
    // Check if debug info shows 1 selected
    await expect(page.locator('.debug-info')).toContainText('Selected: 1');
    
    // Check if the node has the 'selected' class
    await expect(firstNode).toHaveClass(/selected/);
    
    // Get the style and see if it has blue styling
    const selectedStyle = await firstNode.getAttribute('style');
    const hasBlueBackground = selectedStyle?.includes('#e3f2fd') || selectedStyle?.includes('rgb(227, 242, 253)');
    
    console.log('✅ Node selection visual feedback works!');
    console.log('Selected style contains blue background:', hasBlueBackground);
    console.log('Style:', selectedStyle);
    
    expect(hasBlueBackground).toBe(true);
  });
  
  test('should perform basic mouse interaction', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the flow component to load
    await page.waitForSelector('angular-flow-simple');
    
    // Listen for console messages
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });
    
    // Test mousedown on a node
    await page.locator('.xy-flow__node').first().dispatchEvent('mousedown');
    await page.waitForTimeout(100);
    
    // Test mousedown on empty space
    await page.locator('.xy-flow').click({ position: { x: 400, y: 400 } });
    await page.waitForTimeout(100);
    
    // Check if pane events were logged
    const paneMessages = consoleMessages.filter(msg => msg.includes('Pane mouse down:'));
    
    expect(paneMessages.length).toBeGreaterThan(0);
    
    console.log('✅ Mouse interactions work!');
    console.log('All console messages:', consoleMessages);
  });
  
  test('should handle mouse wheel zoom', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the flow component to load
    await page.waitForSelector('angular-flow-simple');
    
    // Check initial zoom
    await expect(page.locator('.debug-info')).toContainText('Zoom: 1.00');
    
    // Perform wheel event to zoom in
    await page.locator('.xy-flow').hover();
    await page.mouse.wheel(0, -100);
    
    // Wait for zoom to update
    await page.waitForTimeout(200);
    
    // Check if zoom level changed
    const debugText = await page.locator('.debug-info').textContent();
    const zoomMatch = debugText?.match(/Zoom: ([\d.]+)/);
    
    if (zoomMatch) {
      const zoomLevel = parseFloat(zoomMatch[1]);
      expect(zoomLevel).toBeGreaterThan(1.0);
      
      console.log('✅ Mouse wheel zoom works!');
      console.log(`Zoom level changed to: ${zoomLevel}`);
    }
  });
});