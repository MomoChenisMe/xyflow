import { test, expect } from '@playwright/test';

test('最終拖拽測試', async ({ page }) => {
  const logs: string[] = [];
  
  // 監聽控制台消息
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('XYDrag') || text.includes('updateNodePositions')) {
      console.log(`Console: ${text}`);
    }
  });

  await page.goto('http://localhost:4200/examples/basic');
  await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
  await page.waitForTimeout(2000); // 等待初始化完成

  console.log('=== 開始拖拽測試 ===');
  
  // 獲取第一個節點
  const node = page.locator('.xy-flow__node').first();
  
  // 獲取初始位置
  const initialBox = await node.boundingBox();
  console.log('初始位置:', initialBox);
  
  // 執行拖拽
  await node.hover();
  await page.mouse.down();
  await page.waitForTimeout(100);
  
  // 移動到新位置
  const targetX = initialBox!.x + 100;
  const targetY = initialBox!.y + 100;
  
  console.log(`拖拽到: (${targetX}, ${targetY})`);
  await page.mouse.move(targetX, targetY, { steps: 5 });
  await page.waitForTimeout(200);
  
  await page.mouse.up();
  await page.waitForTimeout(1000); // 等待位置更新
  
  // 檢查最終位置
  const finalBox = await node.boundingBox();
  console.log('最終位置:', finalBox);
  
  const moved = Math.abs(finalBox!.x - initialBox!.x) > 50 || 
                Math.abs(finalBox!.y - initialBox!.y) > 50;
  
  console.log(`節點移動了: ${moved}`);
  
  // 檢查拖拽事件日誌
  const dragLogs = logs.filter(log => 
    log.includes('XYDrag onDragStart') ||
    log.includes('XYDrag onDrag') ||
    log.includes('XYDrag onDragStop') ||
    log.includes('updateNodePositions called')
  );
  
  console.log('=== 拖拽事件日誌 ===');
  dragLogs.forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });
  
  // 驗證
  expect(moved).toBe(true);
  expect(dragLogs.length).toBeGreaterThan(0);
});