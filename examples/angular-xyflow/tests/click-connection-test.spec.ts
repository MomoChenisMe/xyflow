import { test, expect } from '@playwright/test';

test.describe('Click Connection Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
  });

  test('should create connection using actual click events', async ({ page }) => {
    // Set up console logging
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    // Wait for handles to be available
    await page.waitForTimeout(1000);
    
    // Count initial edges
    const initialEdges = await page.locator('.xy-flow__edge').count();
    console.log(`Initial edges count: ${initialEdges}`);
    
    // Get source and target handles  
    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    const targetHandle = page.locator('.xy-flow__handle.target').nth(1);
    
    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      console.log('Testing click connection...');
      
      // Dispatch actual click events instead of using Playwright's click method
      console.log('Dispatching click on source handle...');
      await sourceHandle.dispatchEvent('click', { bubbles: true });
      await page.waitForTimeout(300);
      
      console.log('Dispatching click on target handle...');
      await targetHandle.dispatchEvent('click', { bubbles: true });
      await page.waitForTimeout(500);
      
      // Check if new edge was created
      const finalEdges = await page.locator('.xy-flow__edge').count();
      console.log(`Final edges count: ${finalEdges}`);
      
      // Look for all relevant logs
      const relevantLogs = consoleLogs.filter(log => 
        log.includes('Handle onClick') ||
        log.includes('CONNECTION CREATED') ||
        log.includes('Handle onPointerDown') ||
        log.includes('connectOnClick') ||
        log.includes('edges before') ||
        log.includes('edges after')
      );
      console.log('All relevant logs:', relevantLogs);
      
      // Check if connection was successful
      if (finalEdges > initialEdges) {
        console.log('✅ Connection successful - new edge created');
      } else {
        console.log('❌ Connection failed - no new edge created');
      }
    }
  });

  test('should test mousedown then click sequence', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });

    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    const targetHandle = page.locator('.xy-flow__handle.target').nth(1);
    
    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      console.log('Testing mousedown -> click sequence...');
      
      // First handle: mousedown then click
      await sourceHandle.dispatchEvent('mousedown', { button: 0 });
      await page.waitForTimeout(50);
      await sourceHandle.dispatchEvent('click', { bubbles: true });
      await page.waitForTimeout(300);
      
      // Second handle: mousedown then click  
      await targetHandle.dispatchEvent('mousedown', { button: 0 });
      await page.waitForTimeout(50);
      await targetHandle.dispatchEvent('click', { bubbles: true });
      await page.waitForTimeout(500);
      
      const allLogs = consoleLogs.filter(log => 
        log.includes('Handle') || 
        log.includes('CONNECTION') ||
        log.includes('click') ||
        log.includes('connectOnClick')
      );
      console.log('All handle/connection logs:', allLogs);
    }
  });
});