import { test, expect } from '@playwright/test';

test.describe('Handle Bounds Test', () => {
  test('should calculate handle bounds correctly', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000); // Give more time for updateNodeInternals to run

    // Try a connection to see if handle bounds are working
    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    const targetHandle = page.locator('.xy-flow__handle.target').nth(1);
    
    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      console.log('Testing connection with handle bounds...');
      
      // Click source
      await sourceHandle.click();
      await page.waitForTimeout(300);
      
      // Click target  
      await targetHandle.click();
      await page.waitForTimeout(500);
    }

    // Check logs for handle bounds updates
    const handleBoundsLogs = logs.filter(log => 
      log.includes('handle bounds') ||
      log.includes('updateNodeInternals') ||
      log.includes('Updated handleBounds') ||
      log.includes('NodeLookup check') ||
      log.includes('Node internals updated')
    );

    console.log('\n=== HANDLE BOUNDS LOGS ===');
    handleBoundsLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    console.log('=== END LOGS ===\n');

    // Check connection results
    const connectionLogs = logs.filter(log => 
      log.includes('XYHandle.isValid result') ||
      log.includes('Valid connection!') ||
      log.includes('Invalid connection')
    );

    console.log('\n=== CONNECTION RESULT LOGS ===');
    connectionLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    console.log('=== END CONNECTION LOGS ===\n');

    // Count edges before and after
    const finalEdges = await page.locator('.xy-flow__edge').count();
    console.log(`Final edges count: ${finalEdges}`);
  });
});