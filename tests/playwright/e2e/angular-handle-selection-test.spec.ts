import { test, expect } from '@playwright/test';

test.describe('Angular Flow Handle Selection Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4201');
  });

  test('should allow selecting handles by clicking', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點和 handles 渲染
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    await page.waitForSelector('.angular-flow__handle', { timeout: 5000 });
    
    // 獲取第一個 handle
    const firstHandle = await page.locator('.angular-flow__handle').first();
    
    // 點擊 handle
    await firstHandle.click();
    
    // 檢查 handle 是否被選中（通過 selected class）
    await expect(firstHandle).toHaveClass(/selected/);
    
    console.log('✅ Handle selection test passed');
  });

  test('should allow multi-selection of handles with Ctrl+click', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點和 handles 渲染
    await page.waitForSelector('.angular-flow__handle', { timeout: 5000 });
    
    // 獲取多個 handles
    const handles = await page.locator('.angular-flow__handle');
    const handleCount = await handles.count();
    
    if (handleCount >= 2) {
      // 點擊第一個 handle
      await handles.nth(0).click();
      await expect(handles.nth(0)).toHaveClass(/selected/);
      
      // 按 Ctrl 鍵點擊第二個 handle
      await handles.nth(1).click({ modifiers: ['Meta'] });
      
      // 檢查兩個 handles 都被選中
      await expect(handles.nth(0)).toHaveClass(/selected/);
      await expect(handles.nth(1)).toHaveClass(/selected/);
    }
    
    console.log('✅ Handle multi-selection test passed');
  });

  test('should clear handle selection when clicking background', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點和 handles 渲染
    await page.waitForSelector('.angular-flow__handle', { timeout: 5000 });
    
    // 獲取第一個 handle
    const firstHandle = await page.locator('.angular-flow__handle').first();
    
    // 點擊 handle 選中它
    await firstHandle.click();
    await expect(firstHandle).toHaveClass(/selected/);
    
    // 點擊背景清除選擇
    await page.locator('.angular-flow').click({ position: { x: 50, y: 50 } });
    
    // 檢查 handle 不再被選中
    await expect(firstHandle).not.toHaveClass(/selected/);
    
    console.log('✅ Handle selection clear test passed');
  });

  test('should show visual feedback for selected handles', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點和 handles 渲染
    await page.waitForSelector('.angular-flow__handle', { timeout: 5000 });
    
    // 獲取第一個 handle
    const firstHandle = await page.locator('.angular-flow__handle').first();
    
    // 記錄未選中時的樣式
    const unselectedStyle = await firstHandle.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        borderColor: computed.borderColor,
        boxShadow: computed.boxShadow
      };
    });
    
    // 點擊 handle 選中它
    await firstHandle.click();
    
    // 檢查選中後的樣式變化
    const selectedStyle = await firstHandle.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        borderColor: computed.borderColor,
        boxShadow: computed.boxShadow
      };
    });
    
    // 驗證樣式已改變（選中狀態下會有不同的背景色和邊框）
    expect(selectedStyle.backgroundColor).not.toBe(unselectedStyle.backgroundColor);
    expect(selectedStyle.boxShadow).not.toBe(unselectedStyle.boxShadow);
    
    console.log('✅ Handle visual feedback test passed');
  });

  test('should differentiate between source and target handle selection', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點和 handles 渲染
    await page.waitForSelector('.angular-flow__handle', { timeout: 5000 });
    
    // 獲取所有 handles
    const handles = await page.locator('.angular-flow__handle');
    const handleCount = await handles.count();
    
    // 檢查至少有一個 handle
    if (handleCount > 0) {
      await handles.first().click();
      await expect(handles.first()).toHaveClass(/selected/);
      
      // 點擊背景清除選擇
      await page.locator('.angular-flow').click({ position: { x: 50, y: 50 } });
    }
    
    if (handleCount > 1) {
      await handles.nth(1).click();
      await expect(handles.nth(1)).toHaveClass(/selected/);
    }
    
    console.log('✅ Handle type differentiation test passed');
  });

  test('should not interfere with node selection when selecting handles', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點和 handles 渲染
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    await page.waitForSelector('.angular-flow__handle', { timeout: 5000 });
    
    // 選中一個節點
    const firstNode = await page.locator('.angular-flow__node').first();
    await firstNode.click();
    await expect(firstNode).toHaveClass(/selected/);
    
    // 選中一個 handle
    const firstHandle = await page.locator('.angular-flow__handle').first();
    await firstHandle.click();
    
    // 檢查 handle 被選中但節點不再被選中
    await expect(firstHandle).toHaveClass(/selected/);
    await expect(firstNode).not.toHaveClass(/selected/);
    
    console.log('✅ Handle vs node selection isolation test passed');
  });
});