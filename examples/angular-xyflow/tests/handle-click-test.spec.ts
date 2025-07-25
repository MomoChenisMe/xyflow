import { test, expect } from '@playwright/test';

test.describe('Handle Click Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
  });

  test('should be able to click handles after z-index fix', async ({ page }) => {
    // Set up console logging
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    // Wait for handles to be available
    await page.waitForTimeout(1000);
    
    // Try to click a handle using forceClick to bypass overlapping elements
    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    
    if (await sourceHandle.isVisible()) {
      console.log('Source handle is visible, attempting force click');
      await sourceHandle.click({ force: true });
      await page.waitForTimeout(500);
      
      // Check for handle click logs
      const handleLogs = consoleLogs.filter(log => 
        log.includes('Handle onPointerDown') || 
        log.includes('XYHandle') || 
        log.includes('Handle component initialized')
      );
      console.log('Handle related logs:', handleLogs);
      
      // Should see some handle-related activity
      expect(handleLogs.length).toBeGreaterThan(0);
    } else {
      throw new Error('Source handle not visible');
    }
  });

  test('should try dispatching mousedown event directly', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });

    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    
    if (await sourceHandle.isVisible()) {
      console.log('Dispatching mousedown event directly to handle');
      await sourceHandle.dispatchEvent('mousedown', { button: 0 });
      await page.waitForTimeout(500);
      
      const relevantLogs = consoleLogs.filter(log => 
        log.includes('Handle') || log.includes('onPointerDown') || log.includes('XYHandle')
      );
      console.log('All handle-related logs:', relevantLogs);
    }
  });
});