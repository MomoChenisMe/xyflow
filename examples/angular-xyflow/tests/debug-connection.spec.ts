import { test, expect } from '@playwright/test';

test.describe('Connection Debug', () => {
  test('should load basic flow and debug connection', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait longer for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot to see what's loaded
    await page.screenshot({ path: 'app-loaded.png' });
    
    // Check what elements are present
    const bodyContent = await page.content();
    console.log('Page HTML length:', bodyContent.length);
    
    // Look for any nodes in the page
    const allElements = await page.$$('*');
    console.log('Total elements on page:', allElements.length);
    
    // Check for xyflow related elements
    const xyflowElements = await page.$$('[class*="react-flow"], [class*="xyflow"], [class*="flow"]');
    console.log('XY Flow related elements:', xyflowElements.length);
    
    // Check for any nodes specifically
    const nodeElements = await page.$$('.react-flow__node, xy-node, [class*="node"]');
    console.log('Node elements found:', nodeElements.length);
    
    // Check for handles
    const handleElements = await page.$$('.react-flow__handle, xy-handle, [class*="handle"]');
    console.log('Handle elements found:', handleElements.length);
    
    // If we found nodes, let's test connection
    if (nodeElements.length >= 2) {
      console.log('Found nodes, testing connection...');
      
      // Try to click on first handle
      const firstHandle = await page.$('.react-flow__handle');
      if (firstHandle) {
        await firstHandle.click();
        console.log('Clicked first handle');
        
        // Try to click on second handle
        const handles = await page.$$('.react-flow__handle');
        if (handles.length > 1) {
          await handles[1].click();
          console.log('Clicked second handle');
        }
        
        // Check if edge was created
        const edges = await page.$$('.react-flow__edge');
        console.log('Edges found after connection attempt:', edges.length);
      }
    }
  });
});