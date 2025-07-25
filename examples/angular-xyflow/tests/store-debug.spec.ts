import { test, expect } from '@playwright/test';

test.describe('Store Debug', () => {
  test('should check store state and handle click', async ({ page }) => {
    // 監聽所有 console 輸出，包括錯誤
    page.on('console', (msg) => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // 導航到頁面
    await page.goto('/', { timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('=== Page loaded, clicking handle ===');
    
    // 查找並點擊handle
    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    await expect(sourceHandle).toBeVisible();
    
    // 模擬mousedown來觸發onPointerDown
    await sourceHandle.dispatchEvent('mousedown', { 
      button: 0,
      clientX: 100,
      clientY: 100 
    });
    
    await page.waitForTimeout(1000);
    
    console.log('=== Handle clicked ===');
  });
});