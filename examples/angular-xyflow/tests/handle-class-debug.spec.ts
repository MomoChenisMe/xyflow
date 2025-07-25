import { test, expect } from '@playwright/test';

test.describe('Handle Classes Debug', () => {
  test('should debug handle class generation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get all handles 
    const handles = await page.$$('[class*="handle"]');
    console.log('Total handles found:', handles.length);
    
    // Inspect each handle's classes in detail
    for (let i = 0; i < Math.min(handles.length, 4); i++) {
      const handle = handles[i];
      const className = await handle.getAttribute('class');
      const dataHandleId = await handle.getAttribute('data-handleid');
      const dataNodeId = await handle.getAttribute('data-nodeid');
      const dataHandlePos = await handle.getAttribute('data-handlepos');
      const dataId = await handle.getAttribute('data-id');
      const dataTestId = await handle.getAttribute('data-testid');
      
      console.log(`Handle ${i}:`);
      console.log(`  class: "${className}"`);
      console.log(`  data-handleid: "${dataHandleId}"`);
      console.log(`  data-nodeid: "${dataNodeId}"`);
      console.log(`  data-handlepos: "${dataHandlePos}"`);
      console.log(`  data-id: "${dataId}"`);
      console.log(`  data-testid: "${dataTestId}"`);
      
      // Check computed style
      const computedStyle = await handle.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          pointerEvents: style.pointerEvents,
          cursor: style.cursor,
          position: style.position,
          backgroundColor: style.backgroundColor,
          border: style.border
        };
      });
      console.log(`  computed style:`, computedStyle);
      
      // Try to click the handle to see if it's interactive
      try {
        const box = await handle.boundingBox();
        if (box) {
          console.log(`  bounding box: ${box.width}x${box.height} at (${box.x}, ${box.y})`);
          
          // Check if handle is visible
          const isVisible = await handle.isVisible();
          console.log(`  visible: ${isVisible}`);
        }
      } catch (error) {
        console.log(`  error getting box: ${error}`);
      }
    }
    
    // Check if there are any Angular flow components
    const angularFlowElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const angularElements = [];
      for (let el of elements) {
        if (el.tagName.toLowerCase().includes('xy-') || 
            el.tagName.toLowerCase().includes('angular-') ||
            el.classList.toString().includes('xy-flow') ||
            el.classList.toString().includes('angular-flow')) {
          angularElements.push({
            tag: el.tagName.toLowerCase(),
            className: el.className,
            id: el.id
          });
        }
      }
      return angularElements.slice(0, 10);
    });
    
    console.log('\nAngular XY Flow elements:');
    angularElements.forEach((el, i) => {
      console.log(`${i + 1}. <${el.tag}> class="${el.className}" id="${el.id}"`);
    });
  });
});