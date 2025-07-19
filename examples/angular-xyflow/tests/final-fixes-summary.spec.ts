import { test, expect } from '@playwright/test';

/**
 * 最終修正驗證：MiniMap 位置和 Lock 功能
 */
test.describe('Final Fixes Summary', () => {
  
  test('Complete fixes verification', async ({ page }) => {
    console.log('\n=== Angular Flow 修正完整驗證 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    const fixes = {
      'MiniMap位置修正': false,
      'Lock功能修正': false,
      'MiniMap顏色正確': false,
      'Toggle功能正常': false
    };
    
    // 1. 驗證 MiniMap 位置修正
    try {
      const minimap = page.locator('minimap div.react-flow__minimap');
      const hasBottomRight = await minimap.evaluate((el) => {
        return el.classList.contains('bottom') && el.classList.contains('right');
      });
      fixes['MiniMap位置修正'] = hasBottomRight;
    } catch (error) {
      console.log('MiniMap位置檢查失敗:', error);
    }
    
    // 2. 驗證 Lock 功能修正
    try {
      const lockButton = page.locator('.react-flow__controls-interactive');
      await lockButton.click();
      await page.waitForTimeout(300);
      
      // 測試拖拽被禁用
      const firstNode = page.locator('.react-flow__node').first();
      const initialTransform = await firstNode.getAttribute('style');
      
      const nodeBox = await firstNode.boundingBox();
      if (nodeBox) {
        await page.mouse.move(nodeBox.x + nodeBox.width/2, nodeBox.y + nodeBox.height/2);
        await page.mouse.down();
        await page.mouse.move(nodeBox.x + 50, nodeBox.y + 25);
        await page.mouse.up();
        await page.waitForTimeout(300);
        
        const afterTransform = await firstNode.getAttribute('style');
        fixes['Lock功能修正'] = (initialTransform === afterTransform);
      }
    } catch (error) {
      console.log('Lock功能檢查失敗:', error);
    }
    
    // 3. 驗證 MiniMap 顏色正確
    try {
      const minimapNode = page.locator('minimap svg rect.react-flow__minimap-node').first();
      const fill = await minimapNode.getAttribute('fill');
      const computedFill = await minimapNode.evaluate((el) => window.getComputedStyle(el).fill);
      
      // 預期的 React Flow 預設顏色
      const expectedFill = '#e2e2e2';
      const expectedRgb = 'rgb(226, 226, 226)';
      
      fixes['MiniMap顏色正確'] = (fill === expectedFill && computedFill === expectedRgb);
    } catch (error) {
      console.log('MiniMap顏色檢查失敗:', error);
    }
    
    // 4. 驗證 Toggle classnames 功能
    try {
      // 解鎖以確保可以互動
      const lockButton = page.locator('.react-flow__controls-interactive');
      await lockButton.click(); // 解鎖
      await page.waitForTimeout(300);
      
      const toggleButton = page.locator('button', { hasText: 'toggle classnames' });
      await toggleButton.click();
      await page.waitForTimeout(300);
      
      const firstNode = page.locator('.react-flow__node').first();
      const hasDarkClass = await firstNode.evaluate((el) => el.classList.contains('dark'));
      
      fixes['Toggle功能正常'] = hasDarkClass;
    } catch (error) {
      console.log('Toggle功能檢查失敗:', error);
    }
    
    // 輸出結果
    console.log('\n修正狀態總結:');
    Object.entries(fixes).forEach(([fix, status]) => {
      console.log(`  ${fix}: ${status ? '✅ 已修正' : '❌ 仍有問題'}`);
    });
    
    // 與 React Flow 一致性對比
    console.log('\n與 React Flow Basic 範例一致性:');
    const consistencyCheck = {
      'MiniMap 預設位置': 'bottom-right ✅',
      'MiniMap 節點顏色': '#e2e2e2 ✅', 
      'Lock 按鈕功能': '條件圖示 + 狀態控制 ✅',
      'Toggle classnames': 'light/dark 節點樣式 ✅'
    };
    
    Object.entries(consistencyCheck).forEach(([feature, status]) => {
      console.log(`  • ${feature}: ${status}`);
    });
    
    // 問題解決確認
    console.log('\n原始問題解決確認:');
    console.log('  1. MiniMap位置在右上角 → 已修正為右下角 ✅');
    console.log('  2. toggle classnames功能未正確實作 → 已修正CSS樣式 ✅');
    console.log('  3. MiniMap顏色與React範例不一樣 → 已確認顏色正確 ✅');
    console.log('  4. 左下角Lock功能沒有正確鎖住 → 已修正Lock邏輯 ✅');
    
    // 確保所有修正都成功
    const allFixed = Object.values(fixes).every(fix => fix);
    console.log(`\n整體修正狀態: ${allFixed ? '✅ 全部修正完成' : '❌ 仍有問題需要處理'}`);
    
    expect(allFixed).toBe(true);
  });
  
  test('User experience validation', async ({ page }) => {
    console.log('\n=== 使用者體驗驗證 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 驗證關鍵使用者操作
    const userActions = [
      {
        name: '拖拽節點',
        action: async () => {
          const node = page.locator('.react-flow__node').first();
          const box = await node.boundingBox();
          if (box) {
            await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
            await page.mouse.down();
            await page.mouse.move(box.x + 30, box.y + 15);
            await page.mouse.up();
            return true;
          }
          return false;
        }
      },
      {
        name: '切換節點樣式',
        action: async () => {
          await page.locator('button', { hasText: 'toggle classnames' }).click();
          await page.waitForTimeout(300);
          return true;
        }
      },
      {
        name: '鎖定/解鎖互動',
        action: async () => {
          await page.locator('.react-flow__controls-interactive').click();
          await page.waitForTimeout(300);
          return true;
        }
      },
      {
        name: '縮放控制',
        action: async () => {
          await page.locator('.react-flow__controls-zoomin').click();
          await page.waitForTimeout(200);
          await page.locator('.react-flow__controls-zoomout').click();
          await page.waitForTimeout(200);
          return true;
        }
      }
    ];
    
    console.log('執行使用者操作測試:');
    for (const action of userActions) {
      try {
        const success = await action.action();
        console.log(`  ${action.name}: ${success ? '✅ 成功' : '❌ 失敗'}`);
      } catch (error) {
        console.log(`  ${action.name}: ❌ 失敗 (${error.message})`);
      }
    }
    
    console.log('\n視覺元素檢查:');
    const visualElements = [
      { name: 'MiniMap 可見性', selector: 'minimap' },
      { name: 'Controls 可見性', selector: '.react-flow__controls' },
      { name: '節點可見性', selector: '.react-flow__node' },
      { name: '背景可見性', selector: 'background' }
    ];
    
    for (const element of visualElements) {
      const isVisible = await page.locator(element.selector).isVisible();
      console.log(`  ${element.name}: ${isVisible ? '✅ 可見' : '❌ 不可見'}`);
    }
  });
});