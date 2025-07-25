import { test, expect } from '@playwright/test';

test.describe('Simple isValid Debug', () => {
  test('should capture detailed debug logs', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Try click connection with current setup
    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    const targetHandle = page.locator('.xy-flow__handle.target').nth(1);
    
    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      console.log('Clicking source handle...');
      await sourceHandle.click();
      await page.waitForTimeout(300);
      
      console.log('Clicking target handle...');
      await targetHandle.click();
      await page.waitForTimeout(500);
    }

    // Filter and print relevant logs
    const relevantLogs = logs.filter(log => 
      log.includes('XYHandle.isValid') || 
      log.includes('Handle onClick') ||
      log.includes('NodeLookup check') ||
      log.includes('Preparing XYHandle.isValid call') ||
      log.includes('Valid connection!') ||
      log.includes('Invalid connection')
    );

    console.log('\n=== RELEVANT DEBUG LOGS ===');
    relevantLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    console.log('=== END LOGS ===\n');

    // Also check what's actually in the DOM
    const handles = await page.locator('.xy-flow__handle').all();
    console.log(`Found ${handles.length} handles in DOM`);
    
    for (let i = 0; i < Math.min(handles.length, 4); i++) {
      const handle = handles[i];
      const classes = await handle.getAttribute('class');
      const nodeId = await handle.getAttribute('data-nodeid');
      const handleId = await handle.getAttribute('data-handleid');
      const dataId = await handle.getAttribute('data-id');
      
      console.log(`Handle ${i}: classes="${classes}", nodeId="${nodeId}", handleId="${handleId}", data-id="${dataId}"`);
    }
  });
});