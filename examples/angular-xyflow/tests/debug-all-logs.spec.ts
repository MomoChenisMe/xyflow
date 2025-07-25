import { test, expect } from '@playwright/test';

test.describe('Debug All Logs', () => {
  test('should capture all console logs during connection', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    const targetHandle = page.locator('.xy-flow__handle.target').nth(1);

    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      console.log('Testing connection...');
      
      // Click source handle
      await sourceHandle.click();
      await page.waitForTimeout(300);
      
      // Click target handle
      await targetHandle.click();
      await page.waitForTimeout(500);
    }

    // Show ALL logs with timestamps
    console.log('\n=== ALL CONSOLE LOGS ===');
    logs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    console.log('=== END ALL LOGS ===\n');

    // Filter for critical logs
    const criticalLogs = logs.filter(log => 
      log.includes('ERROR:') ||
      log.includes('🚨') ||
      log.includes('Emergency') ||
      log.includes('nodeLookup is empty') ||
      log.includes('XYHandle.isValid result')
    );

    console.log('\n=== CRITICAL LOGS ===');
    criticalLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    console.log('=== END CRITICAL LOGS ===\n');
  });
});