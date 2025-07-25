import { test, expect } from '@playwright/test';

test('調試 BasicExample 事件綁定', async ({ page }) => {
  const logs: string[] = [];
  
  // 監聽所有console日誌
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    console.log(text);
  });

  await page.goto('http://localhost:4200/examples/basic');
  await page.waitForSelector('.xy-flow__node', { timeout: 10000 });

  console.log('=== 檢查初始綁定狀態 ===');
  
  // 在瀏覽器控制台中執行檢查
  const bindingCheck = await page.evaluate(() => {
    // 檢查 angular-flow 元素是否存在
    const angularFlow = document.querySelector('angular-flow');
    console.log('angular-flow element found:', !!angularFlow);
    
    // 檢查是否有 onNodesChange 綁定
    if (angularFlow) {
      // 檢查 Angular 組件實例
      const componentRef = (angularFlow as any).__ngContext__?.[8];
      console.log('Component reference:', !!componentRef);
      console.log('Component has onNodesChange output:', componentRef?.onNodesChange);
    }
    
    return {
      angularFlowExists: !!angularFlow,
      hasComponentRef: !!(angularFlow as any).__ngContext__?.[8]
    };
  });
  
  console.log('綁定檢查結果:', bindingCheck);
  
  // 手動觸發一個簡單的測試
  await page.evaluate(() => {
    console.log('🧪 手動測試：從 BasicExample 直接調用 onNodesChange');
    const testNodes = [
      { id: '1', position: { x: 100, y: 200 }, data: { label: 'Test' } }
    ];
    
    // 嘗試直接訪問組件實例
    const angularFlowBasic = document.querySelector('angular-flow-basic');
    if (angularFlowBasic) {
      const basicComponent = (angularFlowBasic as any).__ngContext__?.[8];
      if (basicComponent && basicComponent.onNodesChange) {
        console.log('✅ 找到 BasicExample 組件，手動調用 onNodesChange');
        basicComponent.onNodesChange(testNodes);
      } else {
        console.log('❌ 無法找到 BasicExample 組件的 onNodesChange 方法');
      }
    } else {
      console.log('❌ 無法找到 angular-flow-basic 元素');
    }
  });
  
  await page.waitForTimeout(1000);
  
  // 檢查手動觸發是否有日誌
  const hasManualTest = logs.some(log => log.includes('🧪 手動測試'));
  const hasBasicHandler = logs.some(log => log.includes('🔥 onNodesChange called'));
  
  console.log('\\n=== 測試結果 ===');
  console.log(`手動測試執行: ${hasManualTest}`);
  console.log(`BasicExample handler 被調用: ${hasBasicHandler}`);
  
  expect(true).toBe(true);
});