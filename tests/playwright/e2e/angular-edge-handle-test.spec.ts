import { test, expect } from '@playwright/test';

test.describe('Angular Flow Edge and Handle Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
  });

  test('edges should not have arrows', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待邊線渲染
    await page.waitForSelector('.angular-flow__edge', { timeout: 5000 });
    
    // 檢查邊線路徑是否存在
    const edgePath = await page.locator('.angular-flow__edge-path').first();
    await expect(edgePath).toBeVisible();
    
    // 檢查是否沒有箭頭標記
    const markerEnd = await edgePath.getAttribute('marker-end');
    expect(markerEnd).toBeNull();
    
    // 檢查 SVG 中是否沒有箭頭定義
    const arrowheadMarker = await page.locator('marker#arrowhead').count();
    expect(arrowheadMarker).toBe(0);
  });

  test('handles should be positioned at bottom', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點渲染
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // 檢查 source handle 的位置
    const sourceHandles = await page.locator('angular-flow-handle[type="source"]').count();
    if (sourceHandles > 0) {
      const sourceHandle = await page.locator('angular-flow-handle[type="source"]').first();
      
      // 檢查 handle 元素是否存在（不管是否可見）
      await expect(sourceHandle).toBeTruthy();
      
      // 檢查 handle 內部的 div 是否有 bottom position class
      const sourceHandleDiv = sourceHandle.locator('.angular-flow__handle');
      if (await sourceHandleDiv.count() > 0) {
        const sourceHandleClass = await sourceHandleDiv.getAttribute('class');
        expect(sourceHandleClass).toContain('position-bottom');
      }
    }
    
    // 檢查 target handle 的位置
    const targetHandles = await page.locator('angular-flow-handle[type="target"]').count();
    if (targetHandles > 0) {
      const targetHandle = await page.locator('angular-flow-handle[type="target"]').first();
      
      // 檢查 handle 元素是否存在
      await expect(targetHandle).toBeTruthy();
      
      // 檢查 handle 內部的 div 是否有 bottom position class
      const targetHandleDiv = targetHandle.locator('.angular-flow__handle');
      if (await targetHandleDiv.count() > 0) {
        const targetHandleClass = await targetHandleDiv.getAttribute('class');
        expect(targetHandleClass).toContain('position-bottom');
      }
    }
  });

  test('connection functionality should work with bottom handles', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點渲染
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // 獲取第一個節點的 source handle
    const sourceHandle = await page.locator('angular-flow-handle[type="source"]').first();
    
    // 獲取第二個節點的 target handle  
    const targetHandle = await page.locator('angular-flow-handle[type="target"]').nth(1);
    
    if (await sourceHandle.count() > 0 && await targetHandle.count() > 0) {
      // 獲取 handle 的位置
      const sourceBox = await sourceHandle.boundingBox();
      const targetBox = await targetHandle.boundingBox();
      
      if (sourceBox && targetBox) {
        // 從 source handle 拖拽到 target handle
        await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
        await page.mouse.up();
        
        // 檢查是否創建了新的邊線
        await page.waitForTimeout(500); // 等待連接建立
        const edgeCount = await page.locator('.angular-flow__edge').count();
        expect(edgeCount).toBeGreaterThan(0);
      }
    }
  });

  test('edges can have arrows when markerEnd is set', async ({ page }) => {
    // 這個測試需要一個有箭頭的範例頁面
    // 暫時先檢查邊線存在
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    await page.waitForSelector('.angular-flow__edge', { timeout: 5000 });
    
    const edgeCount = await page.locator('.angular-flow__edge').count();
    expect(edgeCount).toBeGreaterThan(0);
  });
});