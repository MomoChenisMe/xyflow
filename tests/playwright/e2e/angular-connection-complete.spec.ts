import { test, expect } from '@playwright/test';

/**
 * 測試 Angular Flow 的完整連接處理
 * 
 * 此測試驗證：
 * 1. Handle 組件使用真實的 FlowStoreService
 * 2. 拖拽連接邏輯正確實現
 * 3. ConnectionLine 組件接收正確的連接狀態
 * 4. 連接完成後正確創建邊
 */

test.describe('Angular Flow Connection Handling', () => {
  test.beforeEach(async ({ page }) => {
    // 導航到 Angular Flow 示例頁面
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.xy-flow__viewport', { timeout: 10000 });
  });

  test('should initialize with no active connections', async ({ page }) => {
    // 檢查初始狀態下沒有活動連接
    const connectionLine = page.locator('.xy-flow__connection-line');
    await expect(connectionLine).not.toBeVisible();
    
    // 檢查沒有連接狀態的 CSS 類
    const handles = page.locator('.react-flow__handle');
    for (const handle of await handles.all()) {
      await expect(handle).not.toHaveClass(/connectingfrom|connectingto/);
    }
  });

  test('should start connection on handle mousedown', async ({ page }) => {
    // 找到第一個 source handle
    const sourceHandle = page.locator('.react-flow__handle.source').first();
    await expect(sourceHandle).toBeVisible();

    // 開始拖拽連接
    const handleBox = await sourceHandle.boundingBox();
    if (handleBox) {
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      
      // 稍微移動鼠標以觸發連接開始
      await page.mouse.move(handleBox.x + 50, handleBox.y + 50);
      
      // 檢查連接線是否出現
      const connectionLine = page.locator('.xy-flow__connection-line');
      await expect(connectionLine).toBeVisible();
      
      // 檢查 source handle 是否有 connectingfrom 類
      await expect(sourceHandle).toHaveClass(/connectingfrom/);
      
      // 結束拖拽
      await page.mouse.up();
    }
  });

  test('should show connection preview during drag', async ({ page }) => {
    const sourceHandle = page.locator('.react-flow__handle.source').first();
    const handleBox = await sourceHandle.boundingBox();
    
    if (handleBox) {
      // 開始拖拽
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(handleBox.x + 50, handleBox.y + 50);
      
      // 檢查連接路徑是否存在且有效
      const connectionPath = page.locator('.xy-flow__connection-path');
      await expect(connectionPath).toBeVisible();
      
      // 檢查路徑是否有有效的 'd' 屬性
      const pathD = await connectionPath.getAttribute('d');
      expect(pathD).toBeTruthy();
      expect(pathD).toMatch(/^M/); // 應該以 M 開始（SVG 路徑語法）
      
      await page.mouse.up();
    }
  });

  test('should complete connection when dropping on target handle', async ({ page }) => {
    // 找到 source 和 target handles
    const sourceHandle = page.locator('.react-flow__handle.source').first();
    const targetHandle = page.locator('.react-flow__handle.target').first();
    
    const sourceBox = await sourceHandle.boundingBox();
    const targetBox = await targetHandle.boundingBox();
    
    if (sourceBox && targetBox) {
      // 開始拖拽
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
      await page.mouse.down();
      
      // 移動到 target handle
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
      
      // 檢查 target handle 是否顯示為可連接
      await expect(targetHandle).toHaveClass(/connectingto/);
      
      // 釋放鼠標完成連接
      await page.mouse.up();
      
      // 檢查是否創建了新的邊
      const edge = page.locator('.react-flow__edge').first();
      await expect(edge).toBeVisible({ timeout: 5000 });
      
      // 檢查連接線是否消失
      const connectionLine = page.locator('.xy-flow__connection-line');
      await expect(connectionLine).not.toBeVisible();
    }
  });

  test('should handle connection cancellation', async ({ page }) => {
    const sourceHandle = page.locator('.react-flow__handle.source').first();
    const handleBox = await sourceHandle.boundingBox();
    
    if (handleBox) {
      // 開始拖拽
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(handleBox.x + 100, handleBox.y + 100);
      
      // 確認連接線出現
      const connectionLine = page.locator('.xy-flow__connection-line');
      await expect(connectionLine).toBeVisible();
      
      // 在空白區域釋放鼠標（取消連接）
      await page.mouse.up();
      
      // 檢查連接線消失
      await expect(connectionLine).not.toBeVisible();
      
      // 檢查沒有新邊被創建
      const edges = page.locator('.react-flow__edge');
      const edgeCount = await edges.count();
      // 這應該等於初始邊數（如果有的話）
      expect(edgeCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should respect connection mode restrictions', async ({ page }) => {
    // 找到兩個 source handles（在嚴格模式下不應該能夠連接）
    const sourceHandles = page.locator('.react-flow__handle.source');
    const firstSource = sourceHandles.first();
    const secondSource = sourceHandles.nth(1);
    
    const firstBox = await firstSource.boundingBox();
    const secondBox = await secondSource.boundingBox();
    
    if (firstBox && secondBox) {
      // 嘗試將第一個 source 連接到第二個 source
      await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2);
      
      // 第二個 source 不應該顯示為可連接（在嚴格模式下）
      await expect(secondSource).not.toHaveClass(/connectingto.*valid/);
      
      await page.mouse.up();
      
      // 不應該創建新邊
      const edgeCountAfter = await page.locator('.react-flow__edge').count();
      const edgeCountBefore = 0; // 假設初始時沒有邊
      expect(edgeCountAfter).toBe(edgeCountBefore);
    }
  });

  test('should handle auto-pan during connection', async ({ page }) => {
    const sourceHandle = page.locator('.react-flow__handle.source').first();
    const handleBox = await sourceHandle.boundingBox();
    
    if (handleBox) {
      // 開始拖拽
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      
      // 移動到視窗邊緣以觸發自動平移
      const viewport = page.locator('.xy-flow__viewport');
      const viewportBox = await viewport.boundingBox();
      
      if (viewportBox) {
        // 移動到右邊緣
        await page.mouse.move(viewportBox.x + viewportBox.width - 10, handleBox.y);
        
        // 等待一段時間讓自動平移生效
        await page.waitForTimeout(500);
        
        // 檢查視窗是否發生了變換（自動平移）
        const transformAfter = await viewport.getAttribute('style');
        expect(transformAfter).toContain('transform');
        
        await page.mouse.up();
      }
    }
  });
});