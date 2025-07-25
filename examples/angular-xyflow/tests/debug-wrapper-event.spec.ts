import { test, expect } from '@playwright/test';

test('調試 Wrapper 事件接收', async ({ page }) => {
  const logs: string[] = [];
  
  // 監聽所有相關日誌
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    
    // 打印 GraphView 和 WrapperComponent 的所有日誌
    if (text.includes('📊 GraphView') || text.includes('📦 WrapperComponent')) {
      console.log(text);
    }
  });

  await page.goto('http://localhost:4200/examples/basic');
  await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('=== 開始檢查 Wrapper 事件接收 ===');
  
  // 獲取第一個節點並執行簡單拖拽
  const node = page.locator('.xy-flow__node').first();
  
  await node.hover();
  await page.mouse.down();
  await page.waitForTimeout(100);
  
  // 移動一小段距離
  const initialBox = await node.boundingBox();
  await page.mouse.move(initialBox!.x + 30, initialBox!.y + 30, { steps: 2 });
  await page.waitForTimeout(200);
  
  await page.mouse.up();
  await page.waitForTimeout(1000);

  // 檢查 GraphView 相關日誌
  console.log('\\n=== GraphView 相關日誌 ===');
  const graphViewLogs = logs.filter(log => log.includes('📊 GraphView'));
  graphViewLogs.slice(-10).forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });
  
  // 檢查 WrapperComponent 相關日誌
  console.log('\\n=== WrapperComponent 相關日誌 ===');
  const wrapperLogs = logs.filter(log => log.includes('📦 WrapperComponent'));
  wrapperLogs.forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });
  
  const hasGraphViewHandleNodes = graphViewLogs.some(log => log.includes('handleNodesChange called'));
  const hasGraphViewEmit = graphViewLogs.some(log => log.includes('emitted onNodesChange'));
  const hasWrapperHandle = wrapperLogs.some(log => log.includes('handleNodesChange called'));
  
  console.log('\\n=== 事件狀態檢查 ===');
  console.log(`GraphView handleNodesChange 被調用: ${hasGraphViewHandleNodes}`);
  console.log(`GraphView emit onNodesChange: ${hasGraphViewEmit}`);
  console.log(`WrapperComponent handleNodesChange 被調用: ${hasWrapperHandle}`);
  
  if (hasGraphViewEmit && !hasWrapperHandle) {
    console.log('\\n⚠️ 問題：GraphView 發出事件但 WrapperComponent 沒有接收到');
    console.log('可能原因：');
    console.log('1. 事件綁定語法錯誤');
    console.log('2. Angular 變更檢測策略問題');
    console.log('3. 組件層級結構問題');
  }
  
  expect(true).toBe(true); // 總是通過，只為了查看日誌
});