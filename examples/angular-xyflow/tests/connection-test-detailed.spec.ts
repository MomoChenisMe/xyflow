import { test, expect } from '@playwright/test';

test.describe('Connection Functionality Test', () => {
  test('should create connection between nodes when clicking handles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Count initial edges with different selectors
    const reactFlowEdges = await page.$$('.react-flow__edge');
    const allEdges = await page.$$('[class*="edge"], xy-edge, svg path[class*="edge"]');
    
    console.log('React flow edges:', reactFlowEdges.length);
    console.log('All edge-like elements:', allEdges.length);
    
    const initialEdges = allEdges.length > 0 ? allEdges : reactFlowEdges;
    
    // Get all handles with different selectors
    const reactFlowHandles = await page.$$('.react-flow__handle');
    const xyHandles = await page.$$('xy-handle');
    const handleSelector = await page.$$('[data-testid*="handle"]');
    const allHandles = await page.$$('[class*="handle"], xy-handle, [data-handleid]');
    
    console.log('React flow handles:', reactFlowHandles.length);
    console.log('xy-handle elements:', xyHandles.length);
    console.log('Handle test ids:', handleSelector.length);
    console.log('All handle-like elements:', allHandles.length);
    
    const handles = allHandles.length > 0 ? allHandles : xyHandles;
    
    if (handles.length >= 2) {
      // Test different connection scenarios
      
      // Scenario 1: Try drag connection (mousedown -> mousemove -> mouseup)
      console.log('Testing drag connection...');
      
      const firstHandle = handles[0];
      const secondHandle = handles[1];
      
      // Get handle positions
      const firstBox = await firstHandle.boundingBox();
      const secondBox = await secondHandle.boundingBox();
      
      if (firstBox && secondBox) {
        // Start connection drag
        await page.mouse.move(firstBox.x + firstBox.width/2, firstBox.y + firstBox.height/2);
        await page.mouse.down();
        
        // Drag to second handle
        await page.mouse.move(secondBox.x + secondBox.width/2, secondBox.y + secondBox.height/2);
        await page.mouse.up();
        
        // Wait a bit for connection to be created
        await page.waitForTimeout(500);
        
        // Check if new edge was created
        const edgesAfterDrag = await page.$$('.react-flow__edge');
        console.log('Edges after drag:', edgesAfterDrag.length);
        
        if (edgesAfterDrag.length > initialEdges.length) {
          console.log('✓ Drag connection successful');
        } else {
          console.log('✗ Drag connection failed');
        }
      }
      
      // Scenario 2: Try click connection (if connectOnClick is enabled)
      console.log('Testing click connection...');
      
      // Click first handle
      await handles[2]?.click();
      await page.waitForTimeout(200);
      
      // Click second handle  
      await handles[3]?.click();
      await page.waitForTimeout(500);
      
      // Check if new edge was created
      const edgesAfterClick = await page.$$('.react-flow__edge');
      console.log('Edges after click:', edgesAfterClick.length);
      
      // Check for visual connection indicators
      const connectingHandles = await page.$$('.react-flow__handle.connectingfrom, .react-flow__handle.connectingto, .react-flow__handle.clickconnecting');
      console.log('Connecting handles:', connectingHandles.length);
      
      // Check for connection lines
      const connectionLines = await page.$$('.react-flow__connection-line, [class*="connection"]');
      console.log('Connection lines:', connectionLines.length);
      
      // Log handle classes for debugging
      for (let i = 0; i < Math.min(handles.length, 4); i++) {
        const className = await handles[i].getAttribute('class');
        console.log(`Handle ${i} classes:`, className);
      }
      
      // Check console for any errors
      const logs = [];
      page.on('console', msg => logs.push(msg.text()));
      
      await page.waitForTimeout(1000);
      console.log('Console messages:', logs.slice(-5));
    }
    
    // Detailed page inspection
    console.log('\n=== Page Structure Analysis ===');
    
    // Get all elements and their classes
    const allElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const result = [];
      for (let i = 0; i < Math.min(elements.length, 50); i++) {
        const el = elements[i];
        if (el.className && (
          el.className.includes('handle') || 
          el.className.includes('node') || 
          el.className.includes('edge') ||
          el.tagName.toLowerCase().includes('xy')
        )) {
          result.push({
            tag: el.tagName.toLowerCase(),
            className: el.className,
            id: el.id,
            dataAttributes: Object.fromEntries([...el.attributes].filter(attr => attr.name.startsWith('data-')).map(attr => [attr.name, attr.value]))
          });
        }
      }
      return result;
    });
    
    console.log('Relevant elements found:');
    allElements.forEach((el, i) => {
      console.log(`${i + 1}. <${el.tag}> class="${el.className}" id="${el.id}" data-attrs:`, el.dataAttributes);
    });
  });
});