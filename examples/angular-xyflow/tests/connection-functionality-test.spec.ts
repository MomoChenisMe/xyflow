import { test, expect } from '@playwright/test';

test.describe('Connection Functionality Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
  });

  test('should create connection between nodes', async ({ page }) => {
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
    const targetHandle = page.locator('.xy-flow__handle.target').nth(1); // Different node
    
    console.log('Source handle visible:', await sourceHandle.isVisible());
    console.log('Target handle visible:', await targetHandle.isVisible());
    
    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      // Try connection by clicking source then target
      console.log('Starting connection...');
      await sourceHandle.click({ force: true });
      await page.waitForTimeout(300);
      
      console.log('Completing connection...');
      await targetHandle.click({ force: true });
      await page.waitForTimeout(500);
      
      // Check if new edge was created
      const finalEdges = await page.locator('.xy-flow__edge').count();
      console.log(`Final edges count: ${finalEdges}`);
      
      // Look for connection-related logs
      const connectionLogs = consoleLogs.filter(log => 
        log.includes('onConnect') || 
        log.includes('connection') ||
        log.includes('edge') ||
        log.includes('Handle onPointerDown') ||
        log.includes('XYHandle')
      );
      console.log('Connection related logs:', connectionLogs);
      
      // Check if connection was successful
      if (finalEdges > initialEdges) {
        console.log('✅ Connection successful - new edge created');
      } else {
        console.log('❌ Connection failed - no new edge created');
      }
    }
  });

  test('should test drag connection behavior', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });

    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    const targetHandle = page.locator('.xy-flow__handle.target').nth(1);
    
    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      const sourceBox = await sourceHandle.boundingBox();
      const targetBox = await targetHandle.boundingBox();
      
      if (sourceBox && targetBox) {
        console.log('Testing drag connection...');
        
        // Start drag from source handle
        await page.mouse.move(sourceBox.x + sourceBox.width/2, sourceBox.y + sourceBox.height/2);
        await page.mouse.down();
        await page.waitForTimeout(100);
        
        // Drag to target handle
        await page.mouse.move(targetBox.x + targetBox.width/2, targetBox.y + targetBox.height/2);
        await page.waitForTimeout(100);
        
        // Release to complete connection
        await page.mouse.up();
        await page.waitForTimeout(500);
        
        const dragLogs = consoleLogs.filter(log => 
          log.includes('drag') || 
          log.includes('connection') ||
          log.includes('Handle onPointerDown')
        );
        console.log('Drag connection logs:', dragLogs);
      }
    }
  });
});