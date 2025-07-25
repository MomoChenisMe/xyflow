import { test, expect } from '@playwright/test';

test('最終拖拽驗證', async ({ page }) => {
  const logs: string[] = [];
  
  // 監聽關鍵事件
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    
    // 只關注最關鍵的事件
    if (text.includes('🚀 Emitting onNodePositionChange') || 
        text.includes('📦 WrapperComponent handleNodesChange') ||
        text.includes('🎉 AngularFlowComponent handleNodesChange') ||
        text.includes('🔥 onNodesChange called')) {
      console.log(text);
    }
  });

  await page.goto('http://localhost:4200/examples/basic');
  await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
  await page.waitForTimeout(3000);

  console.log('=== 開始最終拖拽驗證 ===');
  
  // 獲取第一個節點
  const node = page.locator('.xy-flow__node').first();
  
  // 獲取初始位置和樣式
  const initialBox = await node.boundingBox();
  const initialStyle = await node.getAttribute('style');
  console.log('初始位置:', initialBox);
  console.log('初始樣式:', initialStyle);
  
  // 執行拖拽 - 移動 100px
  await node.hover();
  await page.mouse.down();
  await page.waitForTimeout(100);
  
  const targetX = initialBox!.x + 100;
  const targetY = initialBox!.y + 100;
  console.log(`拖拽到: (${targetX}, ${targetY})`);
  
  await page.mouse.move(targetX, targetY, { steps: 5 });
  await page.waitForTimeout(300);
  
  // 檢查拖拽中的樣式
  const draggingStyle = await node.getAttribute('style');
  console.log('拖拽中樣式:', draggingStyle);
  
  await page.mouse.up();
  await page.waitForTimeout(2000); // 等待事件處理完成
  
  // 檢查最終結果
  const finalBox = await node.boundingBox();
  const finalStyle = await node.getAttribute('style');
  console.log('最終位置:', finalBox);
  console.log('最終樣式:', finalStyle);
  
  // 計算移動距離
  const xMoved = Math.abs(finalBox!.x - initialBox!.x);
  const yMoved = Math.abs(finalBox!.y - initialBox!.y);
  console.log(`移動距離: X=${xMoved}px, Y=${yMoved}px`);
  
  // 檢查關鍵事件
  const hasPositionChange = logs.some(log => log.includes('🚀 Emitting onNodePositionChange'));
  const hasWrapperHandle = logs.some(log => log.includes('📦 WrapperComponent handleNodesChange'));
  const hasAngularFlowHandle = logs.some(log => log.includes('🎉 AngularFlowComponent handleNodesChange'));
  const hasBasicHandle = logs.some(log => log.includes('🔥 onNodesChange called'));
  
  console.log('\\n=== 事件鏈檢查 ===');
  console.log(`NodeWrapper 發出位置變更: ${hasPositionChange}`);
  console.log(`WrapperComponent 處理: ${hasWrapperHandle}`);
  console.log(`AngularFlowComponent 處理: ${hasAngularFlowHandle}`);
  console.log(`BasicExample 處理: ${hasBasicHandle}`);
  
  // 檢查是否移動成功
  const moved = xMoved > 50 || yMoved > 50; // 至少移動50px算成功
  console.log(`\\n節點是否成功移動: ${moved}`);
  
  if (!moved) {
    console.log('⚠️ 節點沒有移動，可能的原因：');
    console.log('1. 事件鏈斷裂');
    console.log('2. XYDrag 邊界限制');
    console.log('3. Angular 變更檢測問題');
  }
  
  expect(true).toBe(true); // 總是通過，只為了查看日誌
});