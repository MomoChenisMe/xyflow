import { test, expect } from '@playwright/test';

test.describe('Check Errors', () => {
  test('should capture all errors and logs during connection', async ({ page }) => {
    const logs: string[] = [];
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      } else if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(`Page Error: ${error.message}`);
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    const targetHandle = page.locator('.xy-flow__handle.target').nth(1);

    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      console.log('Testing connection with error checking...');
      
      // Click source handle
      await sourceHandle.click();
      await page.waitForTimeout(300);
      
      // Click target handle
      await targetHandle.click();
      await page.waitForTimeout(1000);
    }

    // Check for errors
    if (errors.length > 0) {
      console.log('\n=== ERRORS FOUND ===');
      errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
      console.log('=== END ERRORS ===\n');
    } else {
      console.log('✅ No errors found');
    }

    // Look for connection-related logs
    const connectionLogs = logs.filter(log => 
      log.includes('🔗') ||
      log.includes('onConnectExtended') ||
      log.includes('Valid connection!') ||
      log.includes('addEdge') ||
      log.includes('hasDefaultEdges')
    );

    console.log('\n=== CONNECTION LOGS ===');
    connectionLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    console.log('=== END CONNECTION LOGS ===\n');
  });
});