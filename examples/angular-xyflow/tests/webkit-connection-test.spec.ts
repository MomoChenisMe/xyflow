import { test, expect } from '@playwright/test';

/**
 * WebKit 特定的節點連結測試
 * 使用更直接的方法來測試連結功能
 */

test.describe('WebKit Connection Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });
  });

  test('should test node connection with direct handle targeting', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
        console.log('Console log:', msg.text());
      }
    });
    
    // 檢查初始狀態
    const initialEdgeCount = await page.locator('.react-flow__edge-path').count();
    console.log('Initial edge count:', initialEdgeCount);
    
    // 找到特定的 source 和 target handles
    const sourceHandle = page.locator('.react-flow__handle.source[data-nodeid="3"]');
    const targetHandle = page.locator('.react-flow__handle.target[data-nodeid="4"]');
    
    await expect(sourceHandle).toBeVisible();
    await expect(targetHandle).toBeVisible();
    
    const sourceBBox = await sourceHandle.boundingBox();
    const targetBBox = await targetHandle.boundingBox();
    
    if (sourceBBox && targetBBox) {
      console.log('Source handle bbox:', sourceBBox);
      console.log('Target handle bbox:', targetBBox);
      
      // 清除日誌
      logs.length = 0;
      
      // 方法 1: 直接在 source handle 上 mousedown
      console.log('Method 1: Direct mousedown on source handle');
      await sourceHandle.hover();
      await page.mouse.down();
      await page.waitForTimeout(100);
      
      // 移動到 target handle
      await targetHandle.hover();
      await page.waitForTimeout(100);
      
      // 在 target handle 上釋放
      await page.mouse.up();
      await page.waitForTimeout(500);
      
      console.log('Method 1 logs:', logs);
      
      let finalEdgeCount = await page.locator('.react-flow__edge-path').count();
      console.log('Method 1 final edge count:', finalEdgeCount);
      
      if (finalEdgeCount <= initialEdgeCount) {
        // 方法 2: 使用 dispatchEvent
        console.log('Method 2: Using dispatchEvent');
        logs.length = 0;
        
        await sourceHandle.evaluate((el) => {
          const event = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: el.getBoundingClientRect().x + el.getBoundingClientRect().width / 2,
            clientY: el.getBoundingClientRect().y + el.getBoundingClientRect().height / 2
          });
          el.dispatchEvent(event);
        });
        
        await page.waitForTimeout(100);
        
        await targetHandle.evaluate((el) => {
          const event = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            clientX: el.getBoundingClientRect().x + el.getBoundingClientRect().width / 2,
            clientY: el.getBoundingClientRect().y + el.getBoundingClientRect().height / 2
          });
          document.dispatchEvent(event);
        });
        
        await page.waitForTimeout(500);
        
        console.log('Method 2 logs:', logs);
        
        finalEdgeCount = await page.locator('.react-flow__edge-path').count();
        console.log('Method 2 final edge count:', finalEdgeCount);
      }
      
      if (finalEdgeCount > initialEdgeCount) {
        console.log('✅ Connection successful');
      } else {
        console.log('❌ Connection failed');
        console.log('All logs:', logs);
      }
    }
  });
});