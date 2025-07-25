import { test, expect } from '@playwright/test';

test.describe('Drag Threshold Debug', () => {
  test('should check dragThreshold and other XYHandle parameters', async ({ page }) => {
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

    console.log('=== Checking Store Configuration ===');
    
    // 檢查store的相關配置
    const storeConfig = await page.evaluate(() => {
      const angularFlow = (window as any).angularFlowApp;
      if (angularFlow && angularFlow.store) {
        const state = angularFlow.store.getState();
        return {
          connectionDragThreshold: state.connectionDragThreshold,
          connectionMode: state.connectionMode,
          connectionRadius: state.connectionRadius,
          autoPanOnConnect: state.autoPanOnConnect,
          lib: state.lib,
          rfId: state.rfId,
          hasNodeLookup: !!state.nodeLookup,
          nodeLookupSize: state.nodeLookup ? state.nodeLookup.size : 0,
          hasDomNode: !!state.domNode
        };
      }
      return null;
    });
    
    console.log('Store configuration:', storeConfig);
    
    // ===  測試超過dragThreshold的拖拉 ===
    console.log('\n=== Testing with Large Drag Distance ===');
    
    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    await expect(sourceHandle).toBeVisible();
    
    const sourceBox = await sourceHandle.boundingBox();
    if (!sourceBox) {
      throw new Error('Source handle not found');
    }
    
    console.log('Source handle position:', sourceBox);
    
    // 計算中心點
    const startX = sourceBox.x + sourceBox.width / 2;
    const startY = sourceBox.y + sourceBox.height / 2;
    
    // 確保拖拉距離遠超過dragThreshold（通常是1或2像素）
    const dragDistance = 50; // 50像素，遠超過任何合理的dragThreshold
    const endX = startX + dragDistance;
    const endY = startY + dragDistance;
    
    console.log(`Dragging from (${startX}, ${startY}) to (${endX}, ${endY})`);
    console.log(`Drag distance: ${Math.sqrt(dragDistance * dragDistance * 2)} pixels`);
    
    // 執行拖拉
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    
    // 逐步移動，增加到達dragThreshold的可能性
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const currentX = startX + (dragDistance * i / steps);
      const currentY = startY + (dragDistance * i / steps);
      await page.mouse.move(currentX, currentY);
      await page.waitForTimeout(50); // 給XYHandle時間處理
    }
    
    await page.waitForTimeout(500);
    
    // 檢查連接狀態
    const connectionState = await page.evaluate(() => {
      const angularFlow = (window as any).angularFlowApp;
      if (angularFlow && angularFlow.store) {
        const connection = angularFlow.store.getConnection();
        return connection();
      }
      return null;
    });
    
    console.log('Connection state after large drag:', connectionState);
    
    // 釋放滑鼠
    await page.mouse.up();
    
    // 分析logs
    console.log('\n=== Log Analysis ===');
    const updateConnectionLogs = logs.filter(log => log.includes('🔄 XYHandle updateConnection called'));
    const xyhandleLogs = logs.filter(log => log.includes('XYHandle'));
    
    console.log('UpdateConnection logs:');
    updateConnectionLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log}`);
    });
    
    console.log('\nAll XYHandle related logs:');
    xyhandleLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log}`);
    });
    
    // 檢查connection line是否出現
    const connectionLine = page.locator('.xy-flow__connection-line');
    const connectionPath = page.locator('.xy-flow__connection-path');
    
    console.log('\nConnection elements check:');
    console.log('Connection line exists:', await connectionLine.count() > 0);
    console.log('Connection path exists:', await connectionPath.count() > 0);
    
    if (updateConnectionLogs.length === 0) {
      console.log('\n🔍 Potential Issues:');
      console.log('1. dragThreshold value:', storeConfig?.connectionDragThreshold || 'undefined');
      console.log('2. Node lookup populated:', storeConfig?.hasNodeLookup);
      console.log('3. DOM node available:', storeConfig?.hasDomNode);
      console.log('4. Connection mode:', storeConfig?.connectionMode);
    }
  });
});