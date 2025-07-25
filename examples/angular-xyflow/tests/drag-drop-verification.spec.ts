import { test, expect } from '@playwright/test';

test.describe('Angular XYFlow Drag Drop 驗證', () => {
  test.beforeEach(async ({ page }) => {
    // 等待頁面載入
    await page.goto('http://localhost:4200/examples/basic');
    await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
  });

  test('節點能夠正常拖拉', async ({ page }) => {
    // 獲取第一個節點
    const node = await page.locator('.xy-flow__node').first();
    
    // 獲取初始位置
    const initialBox = await node.boundingBox();
    expect(initialBox).not.toBeNull();
    
    const initialX = initialBox!.x;
    const initialY = initialBox!.y;

    // 執行拖拉操作
    await node.hover();
    await page.mouse.down();
    
    // 移動 100px 到右下角
    await page.mouse.move(initialX + 50, initialY + 50, { steps: 10 });
    await page.waitForTimeout(100);
    
    await page.mouse.up();
    await page.waitForTimeout(500); // 等待位置更新

    // 檢查最終位置
    const finalBox = await node.boundingBox();
    expect(finalBox).not.toBeNull();
    
    const finalX = finalBox!.x;
    const finalY = finalBox!.y;

    // 驗證節點確實移動了
    expect(Math.abs(finalX - initialX)).toBeGreaterThan(20);
    expect(Math.abs(finalY - initialY)).toBeGreaterThan(20);
    
    console.log(`節點從 (${initialX}, ${initialY}) 移動到 (${finalX}, ${finalY})`);
  });

  test('檢查拖拉事件日誌', async ({ page }) => {
    const logs: string[] = [];
    
    // 監聽 console 日誌
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('NodeWrapper') || text.includes('onNodesChange') || text.includes('drag')) {
        logs.push(text);
      }
    });

    // 獲取節點並執行拖拉
    const node = await page.locator('.xy-flow__node').first();
    await node.hover();
    await page.mouse.down();
    await page.mouse.move(300, 200, { steps: 5 });
    await page.mouse.up();
    
    await page.waitForTimeout(1000);

    // 檢查必要的日誌是否存在 (新的 XYDrag 實作)
    const hasXYDragStart = logs.some(log => log.includes('XYDrag onDragStart'));
    const hasXYDragDrag = logs.some(log => log.includes('XYDrag onDrag'));
    const hasUpdateNodePositions = logs.some(log => log.includes('updateNodePositions called'));
    const hasNodesChange = logs.some(log => log.includes('onNodesChange called'));

    expect(hasXYDragStart).toBe(true);
    expect(hasXYDragDrag).toBe(true);
    expect(hasUpdateNodePositions).toBe(true);
    expect(hasNodesChange).toBe(true);

    console.log('✅ 所有必要的拖拉事件都正確觸發');
  });
});