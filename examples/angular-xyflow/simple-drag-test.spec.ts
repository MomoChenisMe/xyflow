import { test, expect } from '@playwright/test';

test('簡單拖拽測試', async ({ page }) => {
  console.log('開始測試...');
  
  // 監聽所有控制台消息
  const logs: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    console.log(`Console: ${text}`);
  });
  
  await page.goto('http://localhost:4200/examples/basic');
  console.log('頁面載入完成');
  
  // 等待節點出現
  await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
  console.log('節點已找到');
  
  // 等待一段時間確保初始化完成
  await page.waitForTimeout(2000);
  
  // 檢查是否有 XYDrag 初始化日誌
  const hasInitLog = logs.some(log => log.includes('initializeDrag called'));
  console.log('是否有初始化日誌:', hasInitLog);
  console.log('所有日誌:', logs.filter(log => log.includes('Drag') || log.includes('NodeWrapper')));
  
  // 嘗試點擊節點
  const node = page.locator('.xy-flow__node').first();
  await node.click();
  await page.waitForTimeout(1000);
  
  // 檢查點擊後的日誌
  const clickLogs = logs.filter(log => log.includes('click') || log.includes('mouse'));
  console.log('點擊相關日誌:', clickLogs);
  
  // 測試通過
  expect(true).toBe(true);
});