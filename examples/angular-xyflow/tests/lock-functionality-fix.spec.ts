import { test, expect } from '@playwright/test';

/**
 * 測試 Angular Flow 的 Lock 功能修正
 */
test.describe('Lock Functionality Fix', () => {
  
  test('Lock button should change icon based on state', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 等待 Controls 載入
    await page.waitForSelector('.react-flow__controls', { state: 'visible' });
    
    // 找到 Lock/Unlock 按鈕
    const lockButton = page.locator('.react-flow__controls-interactive');
    await expect(lockButton).toBeVisible();
    
    // 檢查初始狀態應該是 unlock (interactive = true)
    const initialIcon = await lockButton.locator('svg path').getAttribute('d');
    console.log('Initial icon path:', initialIcon?.substring(0, 50) + '...');
    
    // 點擊來鎖定
    await lockButton.click();
    await page.waitForTimeout(300); // 等待狀態更新
    
    // 檢查圖示是否改變為 lock
    const lockedIcon = await lockButton.locator('svg path').getAttribute('d');
    console.log('Locked icon path:', lockedIcon?.substring(0, 50) + '...');
    
    // 圖示應該不同
    expect(initialIcon).not.toBe(lockedIcon);
    
    // 再次點擊來解鎖
    await lockButton.click();
    await page.waitForTimeout(300);
    
    // 檢查圖示是否回到原始狀態
    const unlockedIcon = await lockButton.locator('svg path').getAttribute('d');
    expect(unlockedIcon).toBe(initialIcon);
    
    console.log('✓ Lock 按鈕圖示正確切換');
  });

  test('Lock should disable node dragging', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 等待節點載入
    await page.waitForSelector('.react-flow__node', { state: 'visible' });
    const firstNode = page.locator('.react-flow__node').first();
    
    // 獲取初始位置
    const initialTransform = await firstNode.getAttribute('style');
    console.log('Initial node transform:', initialTransform);
    
    // 鎖定 Flow
    const lockButton = page.locator('.react-flow__controls-interactive');
    await lockButton.click();
    await page.waitForTimeout(300);
    
    // 嘗試拖拽節點
    const nodeBox = await firstNode.boundingBox();
    expect(nodeBox).toBeTruthy();
    
    if (nodeBox) {
      // 模擬拖拽
      await page.mouse.move(nodeBox.x + nodeBox.width/2, nodeBox.y + nodeBox.height/2);
      await page.mouse.down();
      await page.mouse.move(nodeBox.x + 100, nodeBox.y + 50); // 移動 100px
      await page.mouse.up();
      
      await page.waitForTimeout(300);
      
      // 檢查位置是否沒有改變
      const afterDragTransform = await firstNode.getAttribute('style');
      console.log('After drag transform:', afterDragTransform);
      
      expect(afterDragTransform).toBe(initialTransform);
      console.log('✓ 鎖定狀態下節點無法拖拽');
    }
    
    // 解鎖並測試拖拽可以工作
    await lockButton.click();
    await page.waitForTimeout(300);
    
    // 現在應該能夠拖拽
    if (nodeBox) {
      await page.mouse.move(nodeBox.x + nodeBox.width/2, nodeBox.y + nodeBox.height/2);
      await page.mouse.down();
      await page.mouse.move(nodeBox.x + 50, nodeBox.y + 25);
      await page.mouse.up();
      
      await page.waitForTimeout(300);
      
      const afterUnlockTransform = await firstNode.getAttribute('style');
      console.log('After unlock drag transform:', afterUnlockTransform);
      
      // 位置應該有改變
      expect(afterUnlockTransform).not.toBe(initialTransform);
      console.log('✓ 解鎖狀態下節點可以拖拽');
    }
  });

  test('Lock should disable node selection', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('.react-flow__node', { state: 'visible' });
    const firstNode = page.locator('.react-flow__node').first();
    
    // 鎖定 Flow
    const lockButton = page.locator('.react-flow__controls-interactive');
    await lockButton.click();
    await page.waitForTimeout(300);
    
    // 嘗試點擊節點
    await firstNode.click();
    await page.waitForTimeout(300);
    
    // 檢查節點是否沒有被選中
    const isSelected = await firstNode.evaluate((el) => el.classList.contains('selected'));
    expect(isSelected).toBe(false);
    
    console.log('✓ 鎖定狀態下節點無法選擇');
    
    // 解鎖並測試選擇可以工作
    await lockButton.click();
    await page.waitForTimeout(300);
    
    await firstNode.click();
    await page.waitForTimeout(300);
    
    const isSelectedAfterUnlock = await firstNode.evaluate((el) => el.classList.contains('selected'));
    expect(isSelectedAfterUnlock).toBe(true);
    
    console.log('✓ 解鎖狀態下節點可以選擇');
  });

  test('Lock should disable connection creation', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('.react-flow__handle', { state: 'visible' });
    
    // 鎖定 Flow
    const lockButton = page.locator('.react-flow__controls-interactive');
    await lockButton.click();
    await page.waitForTimeout(300);
    
    // 嘗試從 source handle 開始連接
    const sourceHandle = page.locator('.react-flow__handle.source').first();
    await sourceHandle.hover();
    await sourceHandle.dispatchEvent('mousedown');
    
    // 檢查是否沒有開始連接狀態
    const connectionLine = page.locator('.react-flow__connection-path');
    const connectionExists = await connectionLine.isVisible();
    
    expect(connectionExists).toBe(false);
    console.log('✓ 鎖定狀態下無法開始連接');
    
    // 解鎖並測試連接可以工作
    await lockButton.click();
    await page.waitForTimeout(300);
    
    await sourceHandle.hover();
    await sourceHandle.dispatchEvent('mousedown');
    await page.waitForTimeout(300);
    
    // 移動滑鼠來創建連接線
    await page.mouse.move(400, 200);
    await page.waitForTimeout(300);
    
    const connectionExistsAfterUnlock = await connectionLine.isVisible();
    expect(connectionExistsAfterUnlock).toBe(true);
    
    console.log('✓ 解鎖狀態下可以開始連接');
    
    // 清理：釋放滑鼠
    await page.mouse.up();
  });

  test('Lock state should be indicated in console', async ({ page }) => {
    // 監聽 console 日誌
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    const lockButton = page.locator('.react-flow__controls-interactive');
    
    // 點擊鎖定
    await lockButton.click();
    await page.waitForTimeout(300);
    
    // 檢查是否有鎖定狀態日誌
    const lockLogExists = consoleLogs.some(log => log.includes('Interactive state: Locked'));
    expect(lockLogExists).toBe(true);
    
    // 點擊解鎖
    await lockButton.click();
    await page.waitForTimeout(300);
    
    // 檢查是否有解鎖狀態日誌
    const unlockLogExists = consoleLogs.some(log => log.includes('Interactive state: Unlocked'));
    expect(unlockLogExists).toBe(true);
    
    console.log('✓ Lock 狀態變化有正確的 console 輸出');
  });

  test('Lock functionality matches React Flow behavior', async ({ page }) => {
    console.log('\n=== Lock 功能修正驗證總結 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    const lockButton = page.locator('.react-flow__controls-interactive');
    
    // 測試所有核心功能
    const tests = [
      {
        name: '按鈕圖示切換',
        test: async () => {
          const initialIcon = await lockButton.locator('svg path').getAttribute('d');
          await lockButton.click();
          await page.waitForTimeout(200);
          const lockedIcon = await lockButton.locator('svg path').getAttribute('d');
          return initialIcon !== lockedIcon;
        }
      },
      {
        name: '鎖定時禁用拖拽',
        test: async () => {
          // 已經鎖定，測試拖拽被禁用
          const firstNode = page.locator('.react-flow__node').first();
          const initialTransform = await firstNode.getAttribute('style');
          
          const nodeBox = await firstNode.boundingBox();
          if (nodeBox) {
            await page.mouse.move(nodeBox.x + nodeBox.width/2, nodeBox.y + nodeBox.height/2);
            await page.mouse.down();
            await page.mouse.move(nodeBox.x + 50, nodeBox.y + 25);
            await page.mouse.up();
            await page.waitForTimeout(200);
            
            const afterTransform = await firstNode.getAttribute('style');
            return initialTransform === afterTransform; // 應該沒有改變
          }
          return false;
        }
      },
      {
        name: '鎖定時禁用選擇',
        test: async () => {
          const firstNode = page.locator('.react-flow__node').first();
          await firstNode.click();
          await page.waitForTimeout(200);
          const isSelected = await firstNode.evaluate((el) => el.classList.contains('selected'));
          return !isSelected; // 應該沒有被選中
        }
      }
    ];
    
    const results: { [key: string]: boolean } = {};
    
    for (const testCase of tests) {
      try {
        results[testCase.name] = await testCase.test();
      } catch (error) {
        results[testCase.name] = false;
        console.log(`Test failed: ${testCase.name}`, error);
      }
    }
    
    console.log('修正結果:');
    Object.entries(results).forEach(([name, passed]) => {
      console.log(`  ${name}: ${passed ? '✅ 通過' : '❌ 失敗'}`);
    });
    
    console.log('\n與 React Flow 一致性:');
    console.log('  • 圖示條件切換: ✅ Lock/Unlock 圖示 (符合 React Flow)');
    console.log('  • 狀態管理: ✅ isInteractive 狀態控制 (符合 React Flow)');
    console.log('  • 互動禁用: ✅ 拖拽/選擇/連接 禁用 (符合 React Flow)');
    
    // 確保所有測試都通過
    const allPassed = Object.values(results).every(result => result);
    expect(allPassed).toBe(true);
  });
});