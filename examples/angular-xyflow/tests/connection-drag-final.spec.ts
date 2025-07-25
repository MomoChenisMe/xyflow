import { test, expect } from '@playwright/test';

test.describe('Connection Drag Final Test', () => {
  test('should test connection drag with fixed nodeLookup', async ({ page }) => {
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

    console.log('=== Starting Connection Drag Test ===');
    
    // 查找handle元素
    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    await expect(sourceHandle).toBeVisible();

    // 獲取handle位置
    const sourceBox = await sourceHandle.boundingBox();
    if (!sourceBox) {
      throw new Error('Source handle not found');
    }

    const startX = sourceBox.x + sourceBox.width / 2;
    const startY = sourceBox.y + sourceBox.height / 2;

    // 執行真實的拖拉操作，確保超過dragThreshold
    console.log('=== Performing Real Drag (with sufficient distance) ===');
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    
    // 等待一下讓XYHandle處理
    await page.waitForTimeout(100);
    
    // 拖拉50像素（遠超過dragThreshold=1）
    await page.mouse.move(startX + 50, startY + 50);
    await page.waitForTimeout(500);
    
    // 檢查connection狀態
    const connectionState = await page.evaluate(() => {
      const angularFlow = (window as any).angularFlowApp;
      if (angularFlow && angularFlow.store) {
        const connection = angularFlow.store.getConnection();
        return connection();
      }
      return null;
    });
    
    console.log('Connection state during drag:', connectionState);
    
    // 檢查connection line是否可見
    const connectionLine = page.locator('.xy-flow__connection-line');
    const connectionPath = page.locator('.xy-flow__connection-path');
    
    console.log('Connection line visible:', await connectionLine.isVisible());
    console.log('Connection path visible:', await connectionPath.isVisible());
    
    // 釋放滑鼠
    await page.mouse.up();
    
    // 分析console logs
    console.log('\n=== Console Logs Analysis ===');
    const updateConnectionLogs = logs.filter(log => log.includes('🔄 XYHandle updateConnection called'));
    const storeLogs = logs.filter(log => log.includes('Store state for XYHandle'));
    const lookupLogs = logs.filter(log => log.includes('nodeLookupSize') || log.includes('AngularFlowService nodes'));
    
    console.log('UpdateConnection logs:');
    updateConnectionLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log}`);
    });
    
    console.log('\nStore state logs:');
    storeLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log}`);
    });
    
    console.log('\nNode lookup logs:');
    lookupLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log}`);
    });
    
    if (updateConnectionLogs.length > 0) {
      console.log('\n✅ UpdateConnection was called! Connection drag is working.');
      
      // 檢查connection line是否顯示
      if (await connectionLine.isVisible()) {
        console.log('✅ Connection line is visible during drag!');
      } else {
        console.log('❌ Connection line is not visible, even though updateConnection was called');
      }
    } else {
      console.log('\n❌ UpdateConnection was never called, even with fixed nodeLookup');
      console.log('Possible remaining issues:');
      console.log('1. Other XYHandle parameters still incorrect');
      console.log('2. XYHandle internal logic issue');
      console.log('3. Event handling issue');
    }
  });
});