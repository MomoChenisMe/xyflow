import { test, expect } from '@playwright/test';

test('詳細拖拽調試', async ({ page }) => {
  const logs: string[] = [];
  
  // 監聽所有控制台消息
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    
    // 打印重要的日誌
    if (text.includes('🔥') || text.includes('🎯') || text.includes('🎨') || 
        text.includes('updateNodePositions') || text.includes('XYDrag')) {
      console.log(text);
    }
  });

  await page.goto('http://localhost:4200/examples/basic');
  await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('=== 開始詳細拖拽調試 ===');
  
  // 獲取第一個節點
  const node = page.locator('.xy-flow__node').first();
  
  // 獲取初始位置
  const initialBox = await node.boundingBox();
  console.log('\n初始位置:', initialBox);
  
  // 獲取節點的 style 屬性
  const initialStyle = await node.getAttribute('style');
  console.log('\n初始 style:', initialStyle);
  
  // 開始拖拽
  console.log('\n--- 開始拖拽 ---');
  await node.hover();
  await page.mouse.down();
  await page.waitForTimeout(100);
  
  // 拖拽中
  console.log('\n--- 拖拽中 ---');
  await page.mouse.move(initialBox!.x + 100, initialBox!.y + 100, { steps: 3 });
  await page.waitForTimeout(500);
  
  // 拖拽中檢查 style
  const draggingStyle = await node.getAttribute('style');
  console.log('\n拖拽中 style:', draggingStyle);
  
  // 結束拖拽
  console.log('\n--- 結束拖拽 ---');
  await page.mouse.up();
  await page.waitForTimeout(500); // 等待 setTimeout 清除
  
  // 最終檢查
  const finalBox = await node.boundingBox();
  const finalStyle = await node.getAttribute('style');
  console.log('\n最終位置:', finalBox);
  console.log('\n最終 style:', finalStyle);
  
  // 檢查拖拽相關日誌
  console.log('\n=== 拖拽相關日誌 ===');
  const dragLogs = logs.filter(log => 
    log.includes('🔥') || 
    log.includes('🎯') || 
    log.includes('🎨') ||
    log.includes('updateNodePositions called') ||
    log.includes('XYDrag')
  );
  
  dragLogs.slice(-20).forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });
  
  // 簡單檢查節點是否移動
  const moved = initialBox!.x !== finalBox!.x || initialBox!.y !== finalBox!.y;
  console.log(`\n節點是否移動: ${moved}`);
  
  expect(true).toBe(true); // 總是通過，只為了查看日誌
});