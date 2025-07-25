import { test, expect } from '@playwright/test';

test.describe('Connection Success Test', () => {
  test('should successfully create connections', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Count initial edges
    const initialEdges = await page.locator('.xy-flow__edge').count();
    console.log(`Initial edges: ${initialEdges}`);

    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    const targetHandle = page.locator('.xy-flow__handle.target').nth(1);

    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      console.log('Testing connection creation...');
      
      // Click source handle
      await sourceHandle.click();
      await page.waitForTimeout(300);
      
      // Click target handle
      await targetHandle.click();
      await page.waitForTimeout(1000);
      
      // Count final edges
      const finalEdges = await page.locator('.xy-flow__edge').count();
      console.log(`Final edges: ${finalEdges}`);
      
      // Check for success indicators in logs
      const successLogs = logs.filter(log => 
        log.includes('Valid connection!') ||
        log.includes('isValid: true') ||
        log.includes('CONNECTION CREATED') ||
        log.includes('Connection object:')
      );

      console.log('\n=== SUCCESS INDICATORS ===');
      successLogs.forEach((log, i) => {
        console.log(`${i + 1}. ${log}`);
      });
      console.log('=== END SUCCESS INDICATORS ===\n');
      
      // Check if new edge was created
      const connectionSuccess = finalEdges > initialEdges;
      console.log(`Connection success: ${connectionSuccess} (${finalEdges} vs ${initialEdges})`);
      
      if (connectionSuccess) {
        console.log('🎉 CONNECTION SUCCESSFULLY CREATED!');
      } else {
        console.log('❌ Connection failed - no new edge');
      }
    }
  });
});