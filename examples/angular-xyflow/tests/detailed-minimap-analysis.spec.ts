import { test, expect } from '@playwright/test';

/**
 * 詳細分析 Angular 和 React MiniMap 的視覺差異
 */
test.describe('Detailed MiniMap Analysis', () => {
  
  test('Angular MiniMap detailed measurements', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    console.log('\n=== Angular MiniMap 詳細分析 ===');
    
    // 1. MiniMap 容器分析
    const minimapContainer = page.locator('minimap div.react-flow__minimap');
    await expect(minimapContainer).toBeVisible();
    
    const containerBox = await minimapContainer.boundingBox();
    const containerStyles = await minimapContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        width: computed.width,
        height: computed.height,
        backgroundColor: computed.backgroundColor,
        border: computed.border,
        borderRadius: computed.borderRadius,
        position: computed.position,
        bottom: computed.bottom,
        right: computed.right
      };
    });
    
    console.log('Angular MiniMap 容器:');
    console.log('  尺寸:', containerBox);
    console.log('  樣式:', containerStyles);
    
    // 2. SVG 分析
    const svg = minimapContainer.locator('svg.react-flow__minimap-svg');
    const svgBox = await svg.boundingBox();
    const svgAttrs = await svg.evaluate((el) => ({
      width: el.getAttribute('width'),
      height: el.getAttribute('height'),
      viewBox: el.getAttribute('viewBox')
    }));
    
    console.log('Angular MiniMap SVG:');
    console.log('  實際尺寸:', svgBox);
    console.log('  屬性:', svgAttrs);
    
    // 3. 節點分析
    const minimapNodes = minimapContainer.locator('rect.react-flow__minimap-node');
    const nodeCount = await minimapNodes.count();
    
    console.log(`Angular MiniMap 節點數量: ${nodeCount}`);
    
    if (nodeCount > 0) {
      for (let i = 0; i < nodeCount; i++) {
        const node = minimapNodes.nth(i);
        const nodeAttrs = await node.evaluate((el) => ({
          x: el.getAttribute('x'),
          y: el.getAttribute('y'),
          width: el.getAttribute('width'),
          height: el.getAttribute('height'),
          fill: el.getAttribute('fill'),
          rx: el.getAttribute('rx')
        }));
        
        console.log(`  節點 ${i + 1}:`, nodeAttrs);
      }
    }
    
    // 4. 視口指示器分析
    const mask = minimapContainer.locator('path.react-flow__minimap-mask');
    const maskExists = await mask.isVisible();
    
    if (maskExists) {
      const maskAttrs = await mask.evaluate((el) => ({
        d: el.getAttribute('d')?.substring(0, 100) + '...',
        fill: el.getAttribute('fill'),
        stroke: el.getAttribute('stroke'),
        fillRule: el.getAttribute('fill-rule')
      }));
      
      console.log('Angular MiniMap 視口指示器:', maskAttrs);
    }
    
    // 5. 主流程圖節點對比
    const mainNodes = page.locator('.react-flow__node');
    const mainNodeCount = await mainNodes.count();
    
    console.log(`主流程圖節點數量: ${mainNodeCount}`);
    
    for (let i = 0; i < Math.min(mainNodeCount, 2); i++) {
      const node = mainNodes.nth(i);
      const nodeBox = await node.boundingBox();
      const nodeStyles = await node.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          transform: el.style.transform,
          width: computed.width,
          height: computed.height,
          backgroundColor: computed.backgroundColor
        };
      });
      
      console.log(`  主節點 ${i + 1}:`, { box: nodeBox, styles: nodeStyles });
    }
  });

  test('React MiniMap reference analysis', async ({ page, context }) => {
    console.log('\n=== React MiniMap 參考分析 ===');
    
    // 嘗試連接到 React 範例
    const reactPage = await context.newPage();
    
    try {
      await reactPage.goto('http://localhost:3001/examples/Basic');
      await reactPage.waitForLoadState('networkidle');
      
      const reactMinimap = reactPage.locator('[data-testid="rf__minimap"]');
      const reactMinimapExists = await reactMinimap.isVisible();
      
      if (reactMinimapExists) {
        console.log('✅ React MiniMap 找到');
        
        // React MiniMap 容器分析
        const reactContainerBox = await reactMinimap.boundingBox();
        const reactContainerStyles = await reactMinimap.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            width: computed.width,
            height: computed.height,
            backgroundColor: computed.backgroundColor,
            border: computed.border,
            position: computed.position,
            bottom: computed.bottom,
            right: computed.right
          };
        });
        
        console.log('React MiniMap 容器:');
        console.log('  尺寸:', reactContainerBox);
        console.log('  樣式:', reactContainerStyles);
        
        // React SVG 分析
        const reactSvg = reactMinimap.locator('svg.react-flow__minimap-svg');
        const reactSvgBox = await reactSvg.boundingBox();
        const reactSvgAttrs = await reactSvg.evaluate((el) => ({
          width: el.getAttribute('width'),
          height: el.getAttribute('height'),
          viewBox: el.getAttribute('viewBox')
        }));
        
        console.log('React MiniMap SVG:');
        console.log('  實際尺寸:', reactSvgBox);
        console.log('  屬性:', reactSvgAttrs);
        
        // React 節點分析
        const reactNodes = reactSvg.locator('rect');
        const reactNodeCount = await reactNodes.count();
        
        console.log(`React MiniMap 矩形元素數量: ${reactNodeCount}`);
        
        // 分析每個矩形元素
        for (let i = 0; i < reactNodeCount; i++) {
          const node = reactNodes.nth(i);
          const nodeAttrs = await node.evaluate((el) => ({
            className: el.className.baseVal || el.className,
            x: el.getAttribute('x'),
            y: el.getAttribute('y'),
            width: el.getAttribute('width'),
            height: el.getAttribute('height'),
            fill: el.getAttribute('fill'),
            rx: el.getAttribute('rx')
          }));
          
          console.log(`  React 矩形 ${i + 1}:`, nodeAttrs);
        }
        
        // React 主流程圖節點
        const reactMainNodes = reactPage.locator('.react-flow__node');
        const reactMainNodeCount = await reactMainNodes.count();
        
        console.log(`React 主流程圖節點數量: ${reactMainNodeCount}`);
        
        for (let i = 0; i < Math.min(reactMainNodeCount, 2); i++) {
          const node = reactMainNodes.nth(i);
          const nodeBox = await node.boundingBox();
          const nodeStyles = await node.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              transform: el.style.transform,
              width: computed.width,
              height: computed.height,
              backgroundColor: computed.backgroundColor
            };
          });
          
          console.log(`  React 主節點 ${i + 1}:`, { box: nodeBox, styles: nodeStyles });
        }
        
      } else {
        console.log('❌ React MiniMap 未找到');
      }
      
    } catch (error) {
      console.log('⚠️  無法連接 React 範例:', error.message);
    } finally {
      await reactPage.close();
    }
  });

  test('Lock functionality detailed analysis', async ({ page }) => {
    console.log('\n=== Lock 功能詳細分析 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 測試初始狀態
    console.log('1. 初始狀態 (應為解鎖)');
    
    const lockButton = page.locator('.react-flow__controls-interactive');
    const initialIcon = await lockButton.locator('svg path').getAttribute('d');
    console.log('  初始圖示路徑:', initialIcon?.substring(0, 50) + '...');
    
    // 測試解鎖狀態下的各種互動
    console.log('2. 解鎖狀態下的互動測試');
    
    // 2a. 節點拖拽
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
    
    // 2b. 流程圖拖拽 (panning)
    const flowContainer = page.locator('.react-flow');
    const flowBox = await flowContainer.boundingBox();
    
    // 獲取初始視口位置
    const initialViewport = await page.locator('.react-flow__viewport').getAttribute('style');
    
    if (flowBox) {
      // 在空白區域拖拽
      await page.mouse.move(flowBox.x + 50, flowBox.y + 50);
      await page.mouse.down();
      await page.mouse.move(flowBox.x + 100, flowBox.y + 100);
      await page.mouse.up();
      
      const afterPanViewport = await page.locator('.react-flow__viewport').getAttribute('style');
      const panWorks = initialViewport !== afterPanViewport;
      console.log('  流程圖拖拽可用:', panWorks ? '✅' : '❌');
    }
    
    // 3. 鎖定後的測試
    console.log('3. 鎖定後的互動測試');
    
    await lockButton.click();
    await page.waitForTimeout(300);
    
    const lockedIcon = await lockButton.locator('svg path').getAttribute('d');
    console.log('  鎖定圖示路徑:', lockedIcon?.substring(0, 50) + '...');
    console.log('  圖示是否改變:', initialIcon !== lockedIcon ? '✅' : '❌');
    
    // 3a. 節點拖拽 (應該被禁用)
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
    
    // 3b. 流程圖拖拽 (應該仍可用)
    const beforeLockViewport = await page.locator('.react-flow__viewport').getAttribute('style');
    
    if (flowBox) {
      // 在空白區域拖拽
      await page.mouse.move(flowBox.x + 200, flowBox.y + 200);
      await page.mouse.down();
      await page.mouse.move(flowBox.x + 250, flowBox.y + 250);
      await page.mouse.up();
      
      const afterLockPanViewport = await page.locator('.react-flow__viewport').getAttribute('style');
      const panStillWorks = beforeLockViewport !== afterLockPanViewport;
      console.log('  流程圖拖拽仍可用:', panStillWorks ? '✅' : '❌');
      
      if (!panStillWorks) {
        console.log('  ❌ 問題：Lock 不應該禁用流程圖拖拽');
      }
    }
    
    // 3c. 節點選擇 (應該被禁用)
    await firstNode.click();
    await page.waitForTimeout(300);
    
    const isSelected = await firstNode.evaluate((el) => el.classList.contains('selected'));
    console.log('  節點選擇被禁用:', !isSelected ? '✅' : '❌');
  });

  test('Visual comparison summary', async ({ page }) => {
    console.log('\n=== 視覺差異總結 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 收集 Angular 實現的關鍵數據
    const minimapData = await page.evaluate(() => {
      const minimap = document.querySelector('minimap div.react-flow__minimap');
      const svg = minimap?.querySelector('svg');
      const nodes = minimap?.querySelectorAll('rect.react-flow__minimap-node');
      const mask = minimap?.querySelector('path.react-flow__minimap-mask');
      
      const minimapBox = minimap?.getBoundingClientRect();
      const svgBox = svg?.getBoundingClientRect();
      
      return {
        container: {
          width: minimapBox?.width,
          height: minimapBox?.height,
          backgroundColor: minimap ? window.getComputedStyle(minimap).backgroundColor : null
        },
        svg: {
          width: svg?.getAttribute('width'),
          height: svg?.getAttribute('height'),
          viewBox: svg?.getAttribute('viewBox'),
          actualWidth: svgBox?.width,
          actualHeight: svgBox?.height
        },
        nodes: Array.from(nodes || []).map((node, i) => ({
          index: i,
          x: node.getAttribute('x'),
          y: node.getAttribute('y'),
          width: node.getAttribute('width'),
          height: node.getAttribute('height'),
          fill: node.getAttribute('fill')
        })),
        maskExists: !!mask,
        maskPath: mask?.getAttribute('d')?.substring(0, 100)
      };
    });
    
    console.log('Angular MiniMap 數據摘要:');
    console.log(JSON.stringify(minimapData, null, 2));
    
    // 識別可能的問題
    const issues = [];
    
    if (minimapData.svg.width !== '200' || minimapData.svg.height !== '150') {
      issues.push('SVG 尺寸可能不正確');
    }
    
    if (minimapData.nodes.length > 0) {
      const firstNode = minimapData.nodes[0];
      if (firstNode.width !== '150' || firstNode.height !== '40') {
        issues.push('節點尺寸可能不符合主流程圖節點比例');
      }
    }
    
    if (!minimapData.maskExists) {
      issues.push('視口指示器遺失');
    }
    
    console.log('\n可能的問題:');
    if (issues.length > 0) {
      issues.forEach(issue => console.log(`  ❌ ${issue}`));
    } else {
      console.log('  ✅ 未發現明顯問題');
    }
    
    console.log('\n建議檢查項目:');
    console.log('  1. 節點是否按照主流程圖實際尺寸比例縮放');
    console.log('  2. viewBox 計算是否正確反映所有節點範圍');
    console.log('  3. 視口指示器位置和尺寸是否準確');
    console.log('  4. MiniMap 整體尺寸和樣式是否符合 React Flow 標準');
  });
});