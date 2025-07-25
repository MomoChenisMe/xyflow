import { test, expect } from '@playwright/test';

test('調試節點位置變更事件鏈', async ({ page }) => {
  const logs: string[] = [];
  
  // 監聽所有控制台消息
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    
    // 打印節點位置變更相關的日誌
    if (text.includes('🚀 Emitting onNodePositionChange') || 
        text.includes('📍 NodeRenderer handleNodePositionChange') ||
        text.includes('📤 NodeRenderer emitting onNodesChange') ||
        text.includes('📊 GraphView') ||
        text.includes('📦 WrapperComponent') ||
        text.includes('🎉 AngularFlowComponent') ||
        text.includes('🔥 onNodesChange called')) {
      console.log(text);
    }
  });

  await page.goto('http://localhost:4200/examples/basic');
  await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('=== 開始測試節點位置變更事件鏈 ===');
  
  // 獲取第一個節點
  const node = page.locator('.xy-flow__node').first();
  
  // 執行拖拽
  await node.hover();
  await page.mouse.down();
  await page.waitForTimeout(100);
  
  // 移動一小段距離
  const initialBox = await node.boundingBox();
  await page.mouse.move(initialBox!.x + 50, initialBox!.y + 50, { steps: 3 });
  await page.waitForTimeout(200);
  
  // 結束拖拽
  await page.mouse.up();
  await page.waitForTimeout(1000); // 等待事件處理

  // 檢查相關日誌
  console.log('\n=== 相關事件日誌 ===');
  const relevantLogs = logs.filter(log => 
    log.includes('🚀 Emitting onNodePositionChange') ||
    log.includes('📍 NodeRenderer handleNodePositionChange') ||
    log.includes('📤 NodeRenderer emitting onNodesChange') ||
    log.includes('📊 GraphView') ||
    log.includes('📦 WrapperComponent') ||
    log.includes('🎉 AngularFlowComponent') ||
    log.includes('🔥 onNodesChange called')
  );
  
  relevantLogs.forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });
  
  const hasPositionChangeEvent = relevantLogs.some(log => log.includes('🚀 Emitting onNodePositionChange'));
  const hasNodeRendererHandle = relevantLogs.some(log => log.includes('📍 NodeRenderer handleNodePositionChange'));
  const hasNodesChangeEmit = relevantLogs.some(log => log.includes('📤 NodeRenderer emitting onNodesChange'));
  const hasGraphViewHandle = relevantLogs.some(log => log.includes('📊 GraphView handleNodesChange'));
  const hasGraphViewEmit = relevantLogs.some(log => log.includes('📊 GraphView emitted onNodesChange'));
  const hasWrapperHandle = relevantLogs.some(log => log.includes('📦 WrapperComponent handleNodesChange'));
  const hasWrapperEmit = relevantLogs.some(log => log.includes('📦 WrapperComponent emitted onNodesChange'));
  const hasAngularFlowHandle = relevantLogs.some(log => log.includes('🎉 AngularFlowComponent handleNodesChange'));
  const hasAngularFlowEmit = relevantLogs.some(log => log.includes('🎉 AngularFlowComponent emitted onNodesChange'));
  const hasBasicOnNodesChange = relevantLogs.some(log => log.includes('🔥 onNodesChange called'));
  
  console.log(`\n事件鏈檢查:`);
  console.log(`1. NodeWrapper 發出 onNodePositionChange: ${hasPositionChangeEvent}`);
  console.log(`2. NodeRenderer 處理 handleNodePositionChange: ${hasNodeRendererHandle}`);
  console.log(`3. NodeRenderer 發出 onNodesChange: ${hasNodesChangeEmit}`);
  console.log(`4. GraphView 處理 handleNodesChange: ${hasGraphViewHandle}`);
  console.log(`5. GraphView 發出 onNodesChange: ${hasGraphViewEmit}`);
  console.log(`6. WrapperComponent 處理 handleNodesChange: ${hasWrapperHandle}`);
  console.log(`7. WrapperComponent 發出 onNodesChange: ${hasWrapperEmit}`);
  console.log(`8. AngularFlowComponent 處理 handleNodesChange: ${hasAngularFlowHandle}`);
  console.log(`9. AngularFlowComponent 發出 onNodesChange: ${hasAngularFlowEmit}`);
  console.log(`10. BasicExample 處理 onNodesChange: ${hasBasicOnNodesChange}`);
  
  expect(true).toBe(true); // 總是通過，只為了查看日誌
});