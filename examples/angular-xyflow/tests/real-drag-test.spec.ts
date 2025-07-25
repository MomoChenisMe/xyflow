import { test, expect } from '@playwright/test';

test.describe('Real Drag Connection Test', () => {
  test('should show connection line during real mouse drag', async ({ page }) => {
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

    console.log('=== Starting Real Drag Test ===');
    
    // 查找handle元素
    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    const targetHandle = page.locator('.xy-flow__handle.target').nth(1);

    // 確保handle元素可見
    await expect(sourceHandle).toBeVisible();
    await expect(targetHandle).toBeVisible();

    // 獲取handle位置
    const sourceBox = await sourceHandle.boundingBox();
    const targetBox = await targetHandle.boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error('Handle elements not found');
    }

    console.log('Source handle position:', sourceBox);
    console.log('Target handle position:', targetBox);

    // 執行真實的拖拉操作
    console.log('=== Starting real drag ===');
    
    // 1. 移動到源handle中心
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    
    // 2. 按下滑鼠
    await page.mouse.down();
    
    await page.waitForTimeout(100);
    
    // 檢查按下後的狀態
    const afterMouseDownState = await page.evaluate(() => {
      const angularFlow = (window as any).angularFlowApp;
      if (angularFlow && angularFlow.store) {
        const connection = angularFlow.store.getConnection();
        return connection();
      }
      return null;
    });
    
    console.log('After mouse down connection state:', afterMouseDownState);
    
    // 3. 拖拉到目標位置（中間點）
    const midX = (sourceBox.x + targetBox.x) / 2;
    const midY = (sourceBox.y + targetBox.y) / 2;
    
    await page.mouse.move(midX, midY);
    await page.waitForTimeout(200);
    
    // 檢查拖拉中的狀態
    const duringDragState = await page.evaluate(() => {
      const angularFlow = (window as any).angularFlowApp;
      if (angularFlow && angularFlow.store) {
        const connection = angularFlow.store.getConnection();
        return connection();
      }
      return null;
    });
    
    console.log('During drag connection state:', duringDragState);
    
    // 檢查connection line是否可見
    const connectionLine = page.locator('.xy-flow__connection-line');
    const connectionPath = page.locator('.xy-flow__connection-path');
    
    console.log('Connection line visible during drag:', await connectionLine.isVisible());
    console.log('Connection path visible during drag:', await connectionPath.isVisible());
    
    // 4. 移動到目標handle
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
    await page.waitForTimeout(200);
    
    // 5. 釋放滑鼠
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    // 檢查最終狀態
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
    
    // 分析console logs
    console.log('\n=== Console Logs Analysis ===');
    const updateConnectionLogs = logs.filter(log => log.includes('XYHandle updateConnection called'));
    const pointerLogs = logs.filter(log => log.includes('onPointerDown') || log.includes('XYHandle.onPointerDown'));
    const connectionLogs = logs.filter(log => log.includes('ConnectionInProgress') || log.includes('NoConnection'));
    
    console.log('UpdateConnection logs:');
    updateConnectionLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log}`);
    });
    
    console.log('\nPointer event logs:');
    pointerLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log}`);
    });
    
    console.log('\nConnection state logs:');
    connectionLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log}`);
    });
    
    // 如果沒有updateConnection調用，檢查可能的原因
    if (updateConnectionLogs.length === 0) {
      console.log('\n❌ UpdateConnection was never called!');
      console.log('Possible issues:');
      console.log('1. dragThreshold not reached');
      console.log('2. Handle conditions not met');
      console.log('3. XYHandle parameters incorrect');
    } else {
      console.log(`\n✅ UpdateConnection was called ${updateConnectionLogs.length} times`);
    }
  });
});