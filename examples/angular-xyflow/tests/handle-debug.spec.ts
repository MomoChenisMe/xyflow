import { test, expect } from '@playwright/test';

/**
 * Handle 元素調試測試
 * 檢查 handle 元素的可見性和事件綁定
 */

test.describe('Handle Element Debug Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });
  });

  test('should debug handle elements in WebKit', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
        console.log('Console log:', msg.text());
      }
    });
    
    // 檢查 handle 元素
    const handles = page.locator('.react-flow__handle');
    const handleCount = await handles.count();
    console.log('Total handles:', handleCount);
    
    for (let i = 0; i < handleCount; i++) {
      const handle = handles.nth(i);
      const isVisible = await handle.isVisible();
      const boundingBox = await handle.boundingBox();
      const classes = await handle.getAttribute('class');
      const nodeId = await handle.getAttribute('data-nodeid');
      
      console.log(`Handle ${i}:`, {
        visible: isVisible,
        boundingBox,
        classes,
        nodeId
      });
    }
    
    // 嘗試直接點擊每個 source handle
    const sourceHandles = page.locator('.react-flow__handle.source');
    const sourceCount = await sourceHandles.count();
    
    console.log('Source handles:', sourceCount);
    
    if (sourceCount > 0) {
      console.log('Trying to click first source handle...');
      const firstSourceHandle = sourceHandles.first();
      
      // 確保元素可見
      await expect(firstSourceHandle).toBeVisible();
      
      // 清除日誌
      logs.length = 0;
      
      // 點擊 handle
      await firstSourceHandle.click({ force: true });
      await page.waitForTimeout(500);
      
      console.log('Logs after clicking handle:', logs);
      
      // 嘗試 mousedown 事件
      logs.length = 0;
      console.log('Trying mousedown on handle...');
      
      const handleBBox = await firstSourceHandle.boundingBox();
      if (handleBBox) {
        await page.mouse.move(handleBBox.x + handleBBox.width / 2, handleBBox.y + handleBBox.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(100);
        await page.mouse.up();
        await page.waitForTimeout(500);
        
        console.log('Logs after mousedown:', logs);
      }
    }
  });
});