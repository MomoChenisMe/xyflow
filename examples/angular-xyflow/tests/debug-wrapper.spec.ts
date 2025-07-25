import { test, expect } from '@playwright/test';

test.describe('Debug WrapperComponent', () => {
  test('should see WrapperComponent store sync logs', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });

    await page.goto('/', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Look for WrapperComponent logs
    const wrapperLogs = logs.filter(log => 
      log.includes('📦 WrapperComponent') ||
      log.includes('WrapperComponent') ||
      log.includes('Setting edges') ||
      log.includes('Store edges changed')
    );

    console.log('\n=== WRAPPER COMPONENT LOGS ===');
    wrapperLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    console.log('=== END WRAPPER LOGS ===\n');

    // Also look for all 📦 logs
    const boxLogs = logs.filter(log => log.includes('📦'));
    console.log('\n=== ALL 📦 LOGS ===');
    boxLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    console.log('=== END 📦 LOGS ===\n');

    // Test connection to see if wrapper logs appear
    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    const targetHandle = page.locator('.xy-flow__handle.target').nth(1);

    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      console.log('Testing connection...');
      
      await sourceHandle.click();
      await page.waitForTimeout(500);
      
      await targetHandle.click();
      await page.waitForTimeout(1000);

      // Check for wrapper logs after connection
      const newWrapperLogs = logs.filter(log => 
        log.includes('📦 WrapperComponent') && 
        !wrapperLogs.includes(log)
      );

      console.log('\n=== NEW WRAPPER LOGS AFTER CONNECTION ===');
      newWrapperLogs.forEach((log, i) => {
        console.log(`${i + 1}. ${log}`);
      });
      console.log('=== END NEW WRAPPER LOGS ===\n');
    }
  });
});