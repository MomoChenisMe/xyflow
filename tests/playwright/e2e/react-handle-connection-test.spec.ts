import { test, expect } from '@playwright/test';

test.describe('React Flow Handle Connection Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 導航到 React Basic 範例
    await page.goto('http://localhost:3001/examples/Basic');
    await page.waitForSelector('[data-id="1"]', { timeout: 10000 });
  });

  test('should verify handles exist and are connectable', async ({ page }) => {
    // 檢查節點是否存在
    const node1 = page.locator('[data-id="1"]');
    const node2 = page.locator('[data-id="2"]');
    
    await expect(node1).toBeVisible();
    await expect(node2).toBeVisible();
    
    // 檢查 handles 是否存在
    const sourceHandle = node1.locator('.react-flow__handle-bottom.source');
    const targetHandle = node2.locator('.react-flow__handle-top.target');
    
    await expect(sourceHandle).toBeVisible();
    await expect(targetHandle).toBeVisible();
    
    // 檢查 handle 屬性
    const sourceConnectable = await sourceHandle.getAttribute('class');
    const targetConnectable = await targetHandle.getAttribute('class');
    
    expect(sourceConnectable).toContain('connectable');
    expect(targetConnectable).toContain('connectable');
  });

  test('should create connection by dragging from source to target handle', async ({ page }) => {
    // 監聽控制台日誌以檢查事件
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });

    // 找到未連接的節點
    const node1 = page.locator('[data-id="1"]');
    const node4 = page.locator('[data-id="4"]');
    
    await expect(node1).toBeVisible();
    await expect(node4).toBeVisible();
    
    // 檢查這些節點之間是否已經有連接（應該沒有）
    const existingEdge = page.locator('[data-id="e1-4"]');
    await expect(existingEdge).not.toBeAttached();
    
    // 找到 source 和 target handles
    const sourceHandle = node1.locator('.react-flow__handle-bottom.source');
    const targetHandle = node4.locator('.react-flow__handle-top.target');
    
    await expect(sourceHandle).toBeVisible();
    await expect(targetHandle).toBeVisible();
    
    // 執行拖拽連接
    console.log('Starting drag from source handle...');
    await sourceHandle.hover();
    await page.mouse.down();
    
    // 檢查是否出現連接線
    await page.waitForTimeout(200);
    const connectionLine = page.locator('.react-flow__connectionline, .react-flow__connection');
    const connectionLineVisible = await connectionLine.isVisible();
    console.log('Connection line visible during drag:', connectionLineVisible);
    
    // 移動到目標 handle
    console.log('Moving to target handle...');
    await targetHandle.hover();
    await page.waitForTimeout(100);
    
    // 釋放鼠標按鈕
    console.log('Releasing mouse on target handle...');
    await page.mouse.up();
    
    // 等待連接處理完成
    await page.waitForTimeout(500);
    
    // 檢查是否創建了新的邊線
    const newEdge = page.locator('[data-source="1"][data-target="4"]');
    await expect(newEdge).toBeAttached();
    
    console.log('All console logs:', logs);
    
    // 檢查事件日誌
    const connectionLogs = logs.filter(log => 
      log.includes('connect') || 
      log.includes('Connect') ||
      log.includes('onConnect')
    );
    
    console.log('Connection-related logs:', connectionLogs);
    
    // 驗證連接線在拖拽過程中是可見的
    expect(connectionLineVisible).toBe(true);
  });

  test('should handle invalid connections properly', async ({ page }) => {
    // 測試相同節點內的連接（應該失敗）
    const node1 = page.locator('[data-id="1"]');
    const sourceHandle = node1.locator('.react-flow__handle-bottom.source');
    const targetHandle = node1.locator('.react-flow__handle-top.target');
    
    await expect(sourceHandle).toBeVisible();
    await expect(targetHandle).toBeVisible();
    
    // 記錄初始邊線數量
    const initialEdges = await page.locator('.react-flow__edge').count();
    
    // 嘗試在同一節點內連接
    await sourceHandle.hover();
    await page.mouse.down();
    await targetHandle.hover();
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    
    // 確認沒有新的邊線被創建
    const finalEdges = await page.locator('.react-flow__edge').count();
    expect(finalEdges).toBe(initialEdges);
  });

  test('should show connection indicators during drag', async ({ page }) => {
    const node1 = page.locator('[data-id="1"]');
    const node2 = page.locator('[data-id="2"]');
    
    const sourceHandle = node1.locator('.react-flow__handle-bottom.source');
    const targetHandle = node2.locator('.react-flow__handle-top.target');
    
    // 開始拖拽
    await sourceHandle.hover();
    await page.mouse.down();
    
    await page.waitForTimeout(100);
    
    // 檢查連接指示器
    const connectingFromClass = await sourceHandle.getAttribute('class');
    const connectionIndicatorClass = await targetHandle.getAttribute('class');
    
    expect(connectingFromClass).toContain('connectingfrom');
    expect(connectionIndicatorClass).toContain('connectionindicator');
    
    // 結束拖拽
    await page.mouse.up();
  });

  test('should respect isConnectable prop', async ({ page }) => {
    // 這個測試需要一個有不可連接 handle 的範例
    // 如果沒有，我們會跳過或創建一個
    const handles = await page.locator('.react-flow__handle').all();
    
    for (const handle of handles) {
      const className = await handle.getAttribute('class');
      if (className && !className.includes('connectable')) {
        // 測試不可連接的 handle
        await handle.hover();
        await page.mouse.down();
        
        // 檢查是否沒有連接線出現
        await page.waitForTimeout(200);
        const connectionLine = page.locator('.react-flow__connectionline');
        const visible = await connectionLine.isVisible();
        expect(visible).toBe(false);
        
        await page.mouse.up();
        break;
      }
    }
  });
});