import { test, expect } from '@playwright/test';

/**
 * 驗證 MiniMap 和 Lock 功能的最終修正
 */
test.describe('Final Fixes Verification', () => {
  
  test('Lock functionality fix - should allow panning but block node interactions', async ({ page }) => {
    console.log('\n=== Lock 功能修正驗證 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    const lockButton = page.locator('.react-flow__controls-interactive');
    
    // 1. 測試解鎖狀態
    console.log('1. 解鎖狀態測試');
    
    // 確保是解鎖狀態
    const initialIcon = await lockButton.locator('svg path').getAttribute('d');
    console.log('  初始圖示 (應為解鎖):', initialIcon?.includes('4.114') ? 'Unlock ✅' : 'Lock');
    
    // 測試節點拖拽
    const firstNode = page.locator('.react-flow__node').first();
    const initialNodeTransform = await firstNode.getAttribute('style');
    
    const nodeBox = await firstNode.boundingBox();
    if (nodeBox) {
      await page.mouse.move(nodeBox.x + nodeBox.width/2, nodeBox.y + nodeBox.height/2);
      await page.mouse.down();
      await page.mouse.move(nodeBox.x + 30, nodeBox.y + 15);
      await page.mouse.up();
      
      const afterDragTransform = await firstNode.getAttribute('style');
      const nodeDragWorks = initialNodeTransform !== afterDragTransform;
      console.log('  節點拖拽可用:', nodeDragWorks ? '✅' : '❌');
    }
    
    // 測試流程圖拖拽
    const viewport = page.locator('.react-flow__viewport');
    const initialViewportTransform = await viewport.getAttribute('style');
    
    const flowBox = await page.locator('.react-flow').boundingBox();
    if (flowBox) {
      // 在空白區域拖拽
      await page.mouse.move(flowBox.x + 50, flowBox.y + 50);
      await page.mouse.down();
      await page.mouse.move(flowBox.x + 100, flowBox.y + 100);
      await page.mouse.up();
      
      const afterPanTransform = await viewport.getAttribute('style');
      const panWorks = initialViewportTransform !== afterPanTransform;
      console.log('  流程圖拖拽可用:', panWorks ? '✅' : '❌');
    }
    
    // 2. 鎖定並測試
    console.log('2. 鎖定狀態測試');
    
    await lockButton.click();
    await page.waitForTimeout(300);
    
    const lockedIcon = await lockButton.locator('svg path').getAttribute('d');
    const iconChanged = initialIcon !== lockedIcon;
    console.log('  圖示切換:', iconChanged ? '✅' : '❌');
    console.log('  鎖定圖示 (應為鎖定):', lockedIcon?.includes('4.723') ? 'Lock ✅' : 'Unlock');
    
    // 測試節點拖拽被禁用
    const beforeLockNodeTransform = await firstNode.getAttribute('style');
    
    if (nodeBox) {
      await page.mouse.move(nodeBox.x + nodeBox.width/2, nodeBox.y + nodeBox.height/2);
      await page.mouse.down();
      await page.mouse.move(nodeBox.x + 50, nodeBox.y + 25);
      await page.mouse.up();
      
      const afterLockDragTransform = await firstNode.getAttribute('style');
      const nodeDragBlocked = beforeLockNodeTransform === afterLockDragTransform;
      console.log('  節點拖拽被禁用:', nodeDragBlocked ? '✅' : '❌');
    }
    
    // 重要：測試流程圖拖拽仍然可用
    const beforeLockViewportTransform = await viewport.getAttribute('style');
    
    if (flowBox) {
      // 在空白區域拖拽
      await page.mouse.move(flowBox.x + 200, flowBox.y + 200);
      await page.mouse.down();
      await page.mouse.move(flowBox.x + 250, flowBox.y + 250);
      await page.mouse.up();
      
      const afterLockPanTransform = await viewport.getAttribute('style');
      const panStillWorks = beforeLockViewportTransform !== afterLockPanTransform;
      console.log('  流程圖拖拽仍可用:', panStillWorks ? '✅ 正確' : '❌ 修正失敗');
      
      // 這是關鍵測試 - 鎖定不應該影響 panning
      expect(panStillWorks).toBe(true);
    }
    
    // 測試節點選擇被禁用
    await firstNode.click();
    await page.waitForTimeout(300);
    
    const isSelected = await firstNode.evaluate((el) => el.classList.contains('selected'));
    console.log('  節點選擇被禁用:', !isSelected ? '✅' : '❌');
  });

  test('MiniMap node size fix - should use actual node dimensions', async ({ page }) => {
    console.log('\n=== MiniMap 節點尺寸修正驗證 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 1. 獲取主流程圖節點的實際尺寸
    const mainNode = page.locator('.react-flow__node').first();
    const mainNodeStyles = await mainNode.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        width: parseInt(computed.width),
        height: parseInt(computed.height)
      };
    });
    
    console.log('主流程圖節點尺寸:', mainNodeStyles);
    
    // 2. 獲取 MiniMap 節點尺寸
    const minimapNode = page.locator('minimap svg rect.react-flow__minimap-node').first();
    const minimapNodeAttrs = await minimapNode.evaluate((el) => ({
      width: parseInt(el.getAttribute('width') || '0'),
      height: parseInt(el.getAttribute('height') || '0'),
      x: el.getAttribute('x'),
      y: el.getAttribute('y')
    }));
    
    console.log('MiniMap 節點尺寸:', minimapNodeAttrs);
    
    // 3. 驗證尺寸是否匹配
    const widthMatches = minimapNodeAttrs.width === mainNodeStyles.width;
    const heightMatches = minimapNodeAttrs.height === mainNodeStyles.height;
    
    console.log('尺寸對比:');
    console.log('  寬度匹配:', widthMatches ? '✅' : `❌ (MiniMap: ${minimapNodeAttrs.width}, 主節點: ${mainNodeStyles.width})`);
    console.log('  高度匹配:', heightMatches ? '✅' : `❌ (MiniMap: ${minimapNodeAttrs.height}, 主節點: ${mainNodeStyles.height})`);
    
    // 4. 檢查是否不再使用固定的 40px 高度
    const notUsingOldHeight = minimapNodeAttrs.height !== 40;
    console.log('  不再使用舊的固定高度 (40px):', notUsingOldHeight ? '✅' : '❌ 仍使用固定高度');
    
    // 5. 檢查所有節點是否使用相同的尺寸
    const allMinimapNodes = page.locator('minimap svg rect.react-flow__minimap-node');
    const nodeCount = await allMinimapNodes.count();
    
    console.log(`檢查所有 ${nodeCount} 個 MiniMap 節點尺寸一致性:`);
    
    for (let i = 0; i < nodeCount; i++) {
      const node = allMinimapNodes.nth(i);
      const attrs = await node.evaluate((el) => ({
        width: el.getAttribute('width'),
        height: el.getAttribute('height')
      }));
      
      const consistentWidth = attrs.width === minimapNodeAttrs.width.toString();
      const consistentHeight = attrs.height === minimapNodeAttrs.height.toString();
      
      console.log(`  節點 ${i + 1}:`, consistentWidth && consistentHeight ? '✅' : `❌ (${attrs.width}x${attrs.height})`);
    }
    
    // 驗證關鍵修正
    expect(heightMatches).toBe(true);
    expect(notUsingOldHeight).toBe(true);
  });

  test('MiniMap viewport indicator accuracy', async ({ page }) => {
    console.log('\n=== MiniMap 視口指示器準確性測試 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 獲取視口指示器路徑
    const mask = page.locator('minimap svg path.react-flow__minimap-mask');
    const maskPath = await mask.getAttribute('d');
    
    console.log('視口指示器路徑:', maskPath?.substring(0, 100) + '...');
    
    // 移動視口並檢查指示器是否更新
    const viewport = page.locator('.react-flow__viewport');
    const initialViewport = await viewport.getAttribute('style');
    
    // 拖拽移動視口
    const flow = page.locator('.react-flow');
    const flowBox = await flow.boundingBox();
    
    if (flowBox) {
      await page.mouse.move(flowBox.x + 100, flowBox.y + 100);
      await page.mouse.down();
      await page.mouse.move(flowBox.x + 200, flowBox.y + 200);
      await page.mouse.up();
      
      await page.waitForTimeout(300);
      
      // 檢查視口是否移動
      const afterMoveViewport = await viewport.getAttribute('style');
      const viewportMoved = initialViewport !== afterMoveViewport;
      console.log('視口移動:', viewportMoved ? '✅' : '❌');
      
      // 檢查指示器是否更新
      const updatedMaskPath = await mask.getAttribute('d');
      const indicatorUpdated = maskPath !== updatedMaskPath;
      console.log('視口指示器更新:', indicatorUpdated ? '✅' : '❌');
      
      expect(viewportMoved).toBe(true);
      expect(indicatorUpdated).toBe(true);
    }
  });

  test('Overall comparison with React Flow behavior', async ({ page }) => {
    console.log('\n=== 與 React Flow 行為比較總結 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    const fixes = {
      'Lock 功能正確': false,
      'MiniMap 節點尺寸正確': false,
      'MiniMap 位置正確': false,
      'Toggle 功能正常': false
    };
    
    // 1. 測試 Lock 功能
    const lockButton = page.locator('.react-flow__controls-interactive');
    await lockButton.click(); // 鎖定
    await page.waitForTimeout(300);
    
    // 測試 panning 仍可用
    const viewport = page.locator('.react-flow__viewport');
    const beforePan = await viewport.getAttribute('style');
    
    const flowBox = await page.locator('.react-flow').boundingBox();
    if (flowBox) {
      await page.mouse.move(flowBox.x + 50, flowBox.y + 50);
      await page.mouse.down();
      await page.mouse.move(flowBox.x + 100, flowBox.y + 100);
      await page.mouse.up();
      
      const afterPan = await viewport.getAttribute('style');
      fixes['Lock 功能正確'] = beforePan !== afterPan;
    }
    
    // 2. 測試 MiniMap 節點尺寸
    const mainNode = page.locator('.react-flow__node').first();
    const minimapNode = page.locator('minimap svg rect.react-flow__minimap-node').first();
    
    const mainHeight = await mainNode.evaluate((el) => parseInt(window.getComputedStyle(el).height));
    const minimapHeight = await minimapNode.evaluate((el) => parseInt(el.getAttribute('height') || '0'));
    
    fixes['MiniMap 節點尺寸正確'] = mainHeight === minimapHeight;
    
    // 3. 測試 MiniMap 位置
    const minimap = page.locator('minimap div.react-flow__minimap');
    const hasBottomRight = await minimap.evaluate((el) => {
      return el.classList.contains('bottom') && el.classList.contains('right');
    });
    fixes['MiniMap 位置正確'] = hasBottomRight;
    
    // 4. 測試 Toggle 功能
    await lockButton.click(); // 解鎖
    await page.waitForTimeout(300);
    
    const toggleButton = page.locator('button', { hasText: 'toggle classnames' });
    await toggleButton.click();
    await page.waitForTimeout(300);
    
    const hasDarkClass = await mainNode.evaluate((el) => el.classList.contains('dark'));
    fixes['Toggle 功能正常'] = hasDarkClass;
    
    // 輸出結果
    console.log('修正狀態總結:');
    Object.entries(fixes).forEach(([fix, status]) => {
      console.log(`  ${fix}: ${status ? '✅ 成功' : '❌ 失敗'}`);
    });
    
    console.log('\n與 React Flow 一致性檢查:');
    const consistencyItems = [
      { name: 'Lock 功能 - 只禁用節點互動，保留 panning', status: fixes['Lock 功能正確'] },
      { name: 'MiniMap 節點 - 使用實際節點尺寸', status: fixes['MiniMap 節點尺寸正確'] },
      { name: 'MiniMap 位置 - 右下角', status: fixes['MiniMap 位置正確'] },
      { name: 'Toggle classnames - light/dark 切換', status: fixes['Toggle 功能正常'] }
    ];
    
    consistencyItems.forEach(item => {
      console.log(`  • ${item.name}: ${item.status ? '✅ 符合' : '❌ 不符合'}`);
    });
    
    const allFixed = Object.values(fixes).every(fix => fix);
    console.log(`\n整體修正狀態: ${allFixed ? '✅ 完全修正' : '❌ 仍有問題'}`);
    
    expect(allFixed).toBe(true);
  });
});