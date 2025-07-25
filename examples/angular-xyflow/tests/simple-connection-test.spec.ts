import { test, expect } from '@playwright/test';

test.describe('Simple Connection Test', () => {
  test('should enable click connections and test basic functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Enable click connections using the button
    try {
      const resetButton = await page.$('button[title*="reset"], button:has-text("reset transform")');
      if (resetButton) {
        console.log('Found reset button');
      }
      
      // Look for any button that might toggle connection mode
      const buttons = await page.$$('button');
      console.log(`Found ${buttons.length} buttons`);
      
      // Enable connectOnClick by executing JavaScript directly
      await page.evaluate(() => {
        // Try to find the Angular flow store and enable connectOnClick
        const elements = document.querySelectorAll('*');
        for (let el of elements) {
          if ((el as any).angularFlowStore) {
            console.log('Found Angular flow store, setting connectOnClick to true');
            (el as any).angularFlowStore.setState({ connectOnClick: true });
            break;
          }
        }
      });
      
      console.log('Attempted to enable connectOnClick');
    } catch (error) {
      console.log('Error enabling connectOnClick:', error);
    }
    
    // Get handles and check their properties
    const handles = await page.$$('[class*="handle"]');
    console.log(`Found ${handles.length} handles`);
    
    if (handles.length >= 2) {
      // Get first two handles for testing
      const handle1 = handles[0];
      const handle2 = handles[1];
      
      // Check current classes
      const handle1Classes = await handle1.getAttribute('class');
      const handle2Classes = await handle2.getAttribute('class');
      
      console.log('Handle 1 classes:', handle1Classes);
      console.log('Handle 2 classes:', handle2Classes);
      
      // Try simple click connection
      console.log('Attempting click connection...');
      await handle1.click();
      await page.waitForTimeout(200);
      await handle2.click();
      await page.waitForTimeout(500);
      
      // Check for edges
      const edges = await page.$$('[class*="edge"]');
      console.log(`Edges after click: ${edges.length}`);
      
      // Try hover to see if any visual feedback occurs
      console.log('Testing hover behavior...');
      await handle1.hover();
      await page.waitForTimeout(200);
      
      // Check classes after hover
      const handle1ClassesAfterHover = await handle1.getAttribute('class');
      console.log('Handle 1 classes after hover:', handle1ClassesAfterHover);
      
      // Try to trigger events directly using JavaScript
      console.log('Triggering mousedown event directly...');
      await page.evaluate(() => {
        const handles = document.querySelectorAll('[class*="handle"]');
        if (handles.length >= 2) {
          const handle1 = handles[0] as HTMLElement;
          const handle2 = handles[1] as HTMLElement;
          
          // Dispatch mousedown on first handle
          const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            button: 0
          });
          handle1.dispatchEvent(mouseDownEvent);
          
          console.log('Dispatched mousedown event on handle 1');
          
          // Dispatch mouseup on second handle after a delay
          setTimeout(() => {
            const mouseUpEvent = new MouseEvent('mouseup', {
              bubbles: true,
              cancelable: true,
              button: 0
            });
            handle2.dispatchEvent(mouseUpEvent);
            console.log('Dispatched mouseup event on handle 2');
          }, 100);
        }
      });
      
      await page.waitForTimeout(1000);
      
      // Check edges again
      const edgesAfterJS = await page.$$('[class*="edge"]');
      console.log(`Edges after JS events: ${edgesAfterJS.length}`);
      
      // Check console for any error messages
      const logs = [];
      page.on('console', msg => logs.push(msg.text()));
      await page.waitForTimeout(500);
      console.log('Recent console messages:', logs.slice(-3));
    }
  });
});