import { test, expect } from '@playwright/test';

/**
 * 比較 Angular 和 React MiniMap 的精確實現
 */
test.describe('MiniMap React Comparison', () => {
  
  test('Angular MiniMap node positions should match calculation logic', async ({ page }) => {
    console.log('\n=== Angular MiniMap 節點位置驗證 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('minimap div.react-flow__minimap', { state: 'visible' });
    
    // 獲取主流程圖節點的 positionAbsolute
    const mainNodes = await page.locator('.react-flow__node').evaluateAll((nodes) => {
      return nodes.map((node, index) => {
        const transform = node.style.transform;
        // 解析 translate(Xpx, Ypx) 
        const match = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
        return {
          index,
          id: node.getAttribute('data-id') || `node-${index}`,
          x: match ? parseFloat(match[1]) : 0,
          y: match ? parseFloat(match[2]) : 0,
          width: parseInt(window.getComputedStyle(node).width) || 150,
          height: parseInt(window.getComputedStyle(node).height) || 37
        };
      });
    });
    
    console.log('主流程圖節點 positionAbsolute:', mainNodes);
    
    // 獲取 MiniMap 節點位置
    const minimapNodes = await page.locator('minimap svg rect.react-flow__minimap-node').evaluateAll((nodes) => {
      return nodes.map((node, index) => ({
        index,
        x: parseFloat(node.getAttribute('x') || '0'),
        y: parseFloat(node.getAttribute('y') || '0'),
        width: parseFloat(node.getAttribute('width') || '0'),
        height: parseFloat(node.getAttribute('height') || '0')
      }));
    });
    
    console.log('MiniMap 節點位置:', minimapNodes);
    
    // 驗證 MiniMap 節點使用的是正確的絕對位置
    for (let i = 0; i < Math.min(mainNodes.length, minimapNodes.length); i++) {
      const mainNode = mainNodes[i];
      const minimapNode = minimapNodes[i];
      
      // MiniMap 節點應該使用主節點的絕對位置座標
      console.log(`節點 ${i + 1} 比較:`);
      console.log(`  主節點: (${mainNode.x}, ${mainNode.y})`);
      console.log(`  MiniMap: (${minimapNode.x}, ${minimapNode.y})`);
      
      // 在 SVG viewBox 座標系統中，MiniMap 節點應該直接使用絕對位置
      expect(minimapNode.x).toBeCloseTo(mainNode.x, 1);
      expect(minimapNode.y).toBeCloseTo(mainNode.y, 1);
      
      // 驗證尺寸
      expect(minimapNode.width).toBe(150);
      expect(minimapNode.height).toBe(37);
    }
    
    console.log('✅ 節點位置驗證完成');
  });
  
  test('Angular MiniMap viewport indicator should be accurate', async ({ page }) => {
    console.log('\n=== Angular MiniMap 視口指示器驗證 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 獲取視口變換資訊
    const viewportInfo = await page.locator('.react-flow__viewport').evaluate((viewport) => {
      const transform = viewport.style.transform;
      // 解析 translate(Xpx, Ypx) scale(Z)
      const translateMatch = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
      const scaleMatch = transform.match(/scale\(([^)]+)\)/);
      
      return {
        translateX: translateMatch ? parseFloat(translateMatch[1]) : 0,
        translateY: translateMatch ? parseFloat(translateMatch[2]) : 0,
        zoom: scaleMatch ? parseFloat(scaleMatch[1]) : 1
      };
    });
    
    // 獲取流程圖容器尺寸
    const containerInfo = await page.locator('.react-flow').evaluate((container) => ({
      width: container.offsetWidth,
      height: container.offsetHeight
    }));
    
    console.log('視口資訊:', viewportInfo);
    console.log('容器尺寸:', containerInfo);
    
    // 根據 React Flow 邏輯計算預期的 viewBB
    const expectedViewBB = {
      x: -viewportInfo.translateX / viewportInfo.zoom,
      y: -viewportInfo.translateY / viewportInfo.zoom,
      width: containerInfo.width / viewportInfo.zoom,
      height: containerInfo.height / viewportInfo.zoom
    };
    
    console.log('預期 viewBB:', expectedViewBB);
    
    // 獲取 MiniMap mask 路徑
    const maskPath = await page.locator('minimap path.react-flow__minimap-mask').getAttribute('d');
    console.log('Mask 路徑:', maskPath?.substring(0, 100) + '...');
    
    if (maskPath) {
      // 解析內部矩形（視口指示器）座標
      const innerRectMatch = maskPath.match(/M([^,]+),([^h]+)h([^v]+)v([^h]+)h[^z]+z$/);
      
      if (innerRectMatch) {
        const actualViewBB = {
          x: parseFloat(innerRectMatch[1]),
          y: parseFloat(innerRectMatch[2]),
          width: parseFloat(innerRectMatch[3]),
          height: parseFloat(innerRectMatch[4])
        };
        
        console.log('實際 viewBB (從 mask):', actualViewBB);
        
        // 驗證視口指示器位置是否正確
        expect(actualViewBB.x).toBeCloseTo(expectedViewBB.x, 1);
        expect(actualViewBB.y).toBeCloseTo(expectedViewBB.y, 1);
        expect(actualViewBB.width).toBeCloseTo(expectedViewBB.width, 1);
        expect(actualViewBB.height).toBeCloseTo(expectedViewBB.height, 1);
      }
    }
    
    console.log('✅ 視口指示器驗證完成');
  });
  
  test('MiniMap should respond correctly to viewport changes', async ({ page }) => {
    console.log('\n=== MiniMap 視口變化響應測試 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 獲取初始 mask 路徑
    const initialMask = await page.locator('minimap path.react-flow__minimap-mask').getAttribute('d');
    
    // 拖拽流程圖
    const flowBox = await page.locator('.react-flow').boundingBox();
    if (flowBox) {
      await page.mouse.move(flowBox.x + 100, flowBox.y + 100);
      await page.mouse.down();
      await page.mouse.move(flowBox.x + 200, flowBox.y + 200);
      await page.mouse.up();
      
      await page.waitForTimeout(300);
      
      // 檢查 mask 路徑是否更新
      const updatedMask = await page.locator('minimap path.react-flow__minimap-mask').getAttribute('d');
      
      const maskChanged = initialMask !== updatedMask;
      console.log('拖拽後 mask 路徑更新:', maskChanged ? '✅' : '❌');
      expect(maskChanged).toBe(true);
      
      // 驗證節點位置沒有改變（應該使用絕對位置）
      const nodePositions = await page.locator('minimap svg rect.react-flow__minimap-node').evaluateAll((nodes) => {
        return nodes.map(node => ({
          x: node.getAttribute('x'),
          y: node.getAttribute('y')
        }));
      });
      
      console.log('拖拽後節點位置 (應該不變):', nodePositions);
      
      // 節點位置應該保持不變，因為它們使用絕對座標
      expect(nodePositions[0]).toEqual({ x: '250', y: '5' });
      expect(nodePositions[1]).toEqual({ x: '100', y: '100' });
    }
    
    console.log('✅ 視口變化響應測試完成');
  });
  
  test('Compare with expected React Flow behavior patterns', async ({ page }) => {
    console.log('\n=== React Flow 行為模式比較 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 獲取關鍵數據
    const minimapData = await page.evaluate(() => {
      const minimap = document.querySelector('minimap div.react-flow__minimap');
      const svg = minimap?.querySelector('svg');
      const nodes = Array.from(minimap?.querySelectorAll('rect.react-flow__minimap-node') || []);
      const mask = minimap?.querySelector('path.react-flow__minimap-mask');
      
      return {
        svgViewBox: svg?.getAttribute('viewBox'),
        nodeCount: nodes.length,
        nodePositions: nodes.map(node => ({
          x: node.getAttribute('x'),
          y: node.getAttribute('y'),
          width: node.getAttribute('width'),
          height: node.getAttribute('height')
        })),
        maskPath: mask?.getAttribute('d'),
        maskExists: !!mask
      };
    });
    
    console.log('MiniMap 數據摘要:', minimapData);
    
    // 驗證 React Flow 預期的行為
    const checks = {
      'SVG viewBox 存在': !!minimapData.svgViewBox,
      '節點數量正確': minimapData.nodeCount === 4,
      '節點使用絕對位置': minimapData.nodePositions[0]?.x === '250' && minimapData.nodePositions[0]?.y === '5',
      '節點尺寸正確': minimapData.nodePositions[0]?.width === '150' && minimapData.nodePositions[0]?.height === '37',
      'Viewport indicator 存在': minimapData.maskExists,
      'Mask 路徑包含兩個矩形': minimapData.maskPath?.includes('z M') || false
    };
    
    console.log('React Flow 行為檢查:');
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`  ${check}: ${passed ? '✅' : '❌'}`);
      expect(passed).toBe(true);
    });
    
    console.log('✅ React Flow 行為模式比較完成');
  });
});