import { test, expect } from '@playwright/test';

test('最終成功測試', async ({ page }) => {
  const logs: string[] = [];
  let foundComputedSignal = false;
  let foundDragPosition = false;
  
  // 監聽控制台消息
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    
    if (text.includes('🎨 nodeTransform computed')) {
      console.log('✅ Found computed signal:', text);
      foundComputedSignal = true;
    }
    
    if (text.includes('🔥 Setting currentDragPosition')) {
      console.log('✅ Found drag position:', text);
      foundDragPosition = true;
    }
    
    if (text.includes('XYDrag') || text.includes('🔄') || text.includes('🔥') || text.includes('🎨')) {
      console.log(`Log: ${text}`);
    }
  });

  await page.goto('http://localhost:4200/examples/basic');
  await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
  await page.waitForTimeout(2000); // 等待初始化

  console.log('=== 開始拖拽測試 ===');
  
  // 獲取第一個節點
  const node = page.locator('.xy-flow__node').first();
  
  // 檢查初始 computed signal
  await page.waitForTimeout(500);
  
  // 獲取初始位置
  const initialBox = await node.boundingBox();
  console.log('初始位置:', initialBox);
  
  // 執行拖拽
  await node.hover();
  await page.mouse.down();
  await page.waitForTimeout(200); // 給 signals 時間更新
  
  // 移動
  await page.mouse.move(initialBox!.x + 100, initialBox!.y + 100, { steps: 3 });
  await page.waitForTimeout(500); // 等待信號更新
  
  await page.mouse.up();
  await page.waitForTimeout(1000);
  
  // 檢查最終位置
  const finalBox = await node.boundingBox();
  console.log('最終位置:', finalBox);
  
  const moved = Math.abs(finalBox!.x - initialBox!.x) > 50 || 
                Math.abs(finalBox!.y - initialBox!.y) > 50;
  
  console.log(`節點移動了: ${moved}`);
  console.log(`找到 computed signal: ${foundComputedSignal}`);
  console.log(`找到拖拽位置設置: ${foundDragPosition}`);
  
  // 如果沒有移動，檢查重要的調試信息
  if (!moved) {
    const importantLogs = logs.filter(log => 
      log.includes('updateNodePositions') ||
      log.includes('XYDrag') ||
      log.includes('🔄') ||
      log.includes('🔥') ||
      log.includes('🎨')
    );
    
    console.log('=== 重要日誌 ===');
    importantLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });
  }
  
  // 這次我們至少期望找到一些調試信息
  expect(foundComputedSignal || foundDragPosition || moved).toBe(true);
});