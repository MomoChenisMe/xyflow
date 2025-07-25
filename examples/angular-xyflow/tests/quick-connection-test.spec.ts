import { test, expect } from '@playwright/test';

test.describe('Quick Connection Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
  });

  test('should find handles and show connection info', async ({ page }) => {
    // Set up console logging
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    // Wait for handles to be available
    await page.waitForTimeout(1000);
    
    // Find all handles
    const handles = await page.locator('.xy-flow__handle').all();
    console.log(`Found ${handles.length} handles`);
    
    for (let i = 0; i < Math.min(handles.length, 4); i++) {
      const handle = handles[i];
      const classes = await handle.getAttribute('class');
      const dataId = await handle.getAttribute('data-id');
      const nodeId = await handle.getAttribute('data-nodeid');
      const handleId = await handle.getAttribute('data-handleid');
      
      console.log(`Handle ${i}: classes=${classes}, dataId=${dataId}, nodeId=${nodeId}, handleId=${handleId}`);
    }
    
    // Look for source and target handles
    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    const targetHandle = page.locator('.xy-flow__handle.target').first();
    
    console.log('Source handle visible:', await sourceHandle.isVisible());
    console.log('Target handle visible:', await targetHandle.isVisible());
    
    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      console.log('Both handles found - testing click on source');
      await sourceHandle.click();
      await page.waitForTimeout(500);
      
      // Check for connection state logs
      const connectionLogs = consoleLogs.filter(log => 
        log.includes('Handle onPointerDown') || 
        log.includes('XYHandle') || 
        log.includes('connection')
      );
      console.log('Connection related logs:', connectionLogs);
    }
  });
});