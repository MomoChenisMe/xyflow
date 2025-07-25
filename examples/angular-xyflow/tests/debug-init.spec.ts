import { test, expect } from '@playwright/test';

test('Debug XYDrag 初始化', async ({ page }) => {
  const logs: string[] = [];
  
  // 監聽控制台日誌
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
  });

  await page.goto('http://localhost:4200/examples/basic');
  
  // 等待頁面完全加載
  await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
  await page.waitForTimeout(3000); // 等待初始化完成
  
  // 檢查初始化相關日誌
  const initLogs = logs.filter(log => 
    log.includes('initializeDrag') || 
    log.includes('updateDragConfig') ||
    log.includes('XYDrag') ||
    log.includes('NodeWrapper')
  );
  
  console.log('=== 初始化相關日誌 ===');
  initLogs.forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });
  
  // 檢查是否有錯誤日誌
  const errorLogs = logs.filter(log => 
    log.includes('❌') || 
    log.includes('error') || 
    log.includes('Error')
  );
  
  if (errorLogs.length > 0) {
    console.log('=== 錯誤日誌 ===');
    errorLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });
  }
  
  expect(true).toBe(true); // 總是通過，只為了查看日誌
});