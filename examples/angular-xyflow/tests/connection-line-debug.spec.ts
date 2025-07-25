import { test, expect } from '@playwright/test';

test.describe('Connection Line Debug', () => {
  test('should show connection line when dragging from handle', async ({ page }) => {
    // 監聽所有 console 輸出
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });

    // 導航到頁面
    await page.goto('/', { timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('=== Initial State ===');
    
    // 檢查初始的connection狀態
    const initialConnectionState = await page.evaluate(() => {
      const angularFlow = (window as any).angularFlowApp;
      if (angularFlow && angularFlow.store) {
        const connection = angularFlow.store.getConnection();
        return {
          connectionSignal: connection(),
          connectionType: typeof connection
        };
      }
      return null;
    });
    
    console.log('Initial connection state:', initialConnectionState);

    // 查找handle元素
    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    const targetHandle = page.locator('.xy-flow__handle.target').nth(1);

    // 確保handle元素可見
    await expect(sourceHandle).toBeVisible();
    await expect(targetHandle).toBeVisible();

    console.log('=== Testing Handle Mousedown ===');
    
    // 模擬mousedown（開始拖拉）
    await sourceHandle.dispatchEvent('mousedown', { 
      button: 0,
      clientX: 100,
      clientY: 100 
    });
    
    await page.waitForTimeout(500);

    // 檢查mousedown後的connection狀態
    const afterMousedownState = await page.evaluate(() => {
      const angularFlow = (window as any).angularFlowApp;
      if (angularFlow && angularFlow.store) {
        const connection = angularFlow.store.getConnection();
        return connection();
      }
      return null;
    });
    
    console.log('After mousedown connection state:', afterMousedownState);

    // 查找connection line元素
    const connectionLine = page.locator('.xy-flow__connection-line');
    const connectionPath = page.locator('.xy-flow__connection-path');
    
    console.log('Connection line visible:', await connectionLine.isVisible());
    console.log('Connection path visible:', await connectionPath.isVisible());
    
    // 模擬mousemove（拖拉過程）
    await page.mouse.move(200, 200);
    await page.waitForTimeout(300);
    
    // 檢查mousemove後的connection狀態
    const afterMousemoveState = await page.evaluate(() => {
      const angularFlow = (window as any).angularFlowApp;
      if (angularFlow && angularFlow.store) {
        const connection = angularFlow.store.getConnection();
        return connection();
      }
      return null;
    });
    
    console.log('After mousemove connection state:', afterMousemoveState);
    
    // 再次檢查connection line
    console.log('After mousemove - Connection line visible:', await connectionLine.isVisible());
    console.log('After mousemove - Connection path visible:', await connectionPath.isVisible());

    // 模擬mouseup（結束拖拉）
    await targetHandle.dispatchEvent('mouseup');
    await page.waitForTimeout(500);

    // 檢查所有相關的console logs
    console.log('\n=== Console Logs Analysis ===');
    const updateConnectionLogs = logs.filter(log => log.includes('updateConnection') || log.includes('XYHandle'));
    const connectionStateLogs = logs.filter(log => log.includes('connection') && (log.includes('inProgress') || log.includes('ConnectionState')));
    
    console.log('UpdateConnection logs:');
    updateConnectionLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log}`);
    });
    
    console.log('\nConnection state logs:');
    connectionStateLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log}`);
    });

    // 最終狀態檢查
    const finalState = await page.evaluate(() => {
      const angularFlow = (window as any).angularFlowApp;
      if (angularFlow && angularFlow.store) {
        const connection = angularFlow.store.getConnection();
        const edges = angularFlow.store.getEdges();
        return {
          connection: connection(),
          edgeCount: edges ? edges.length : 0
        };
      }
      return null;
    });
    
    console.log('Final state:', finalState);
  });
});