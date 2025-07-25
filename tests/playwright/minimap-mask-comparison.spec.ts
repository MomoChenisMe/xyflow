import { test, expect } from '@playwright/test';

test.describe('MiniMap Mask Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4201/');
    await page.waitForTimeout(3000);
  });

  test('詳細對比Angular和React的Mask計算邏輯', async ({ page }) => {
    console.log('🔍 分析Angular Mask計算邏輯...');
    
    const maskAnalysis = await page.evaluate(() => {
      const minimapSvg = document.querySelector('.react-flow__minimap-svg');
      const maskPath = document.querySelector('.react-flow__minimap-mask');
      
      if (!minimapSvg || !maskPath) {
        return { error: 'SVG or mask not found' };
      }
      
      // 解析mask路徑
      const pathData = maskPath.getAttribute('d') || '';
      const pathSegments = pathData.split('M').filter(s => s.trim());
      
      let outerRect = null;
      let innerRect = null;
      
      if (pathSegments.length >= 2) {
        // 解析外層矩形 (第一個M之後)
        const outerMatch = pathSegments[0].match(/(-?[\d.]+),(-?[\d.]+)h(-?[\d.]+)v(-?[\d.]+)h(-?[\d.]+)z/);
        if (outerMatch) {
          const [, x, y, w, h] = outerMatch.map(Number);
          outerRect = { x, y, width: w, height: Math.abs(h) };
        }
        
        // 解析內層矩形 (第二個M之後)
        const innerMatch = pathSegments[1].match(/(-?[\d.]+),(-?[\d.]+)h(-?[\d.]+)v(-?[\d.]+)h(-?[\d.]+)z/);
        if (innerMatch) {
          const [, x, y, w, h] = innerMatch.map(Number);
          innerRect = { x, y, width: w, height: Math.abs(h) };
        }
      }
      
      return {
        svgDimensions: {
          width: minimapSvg.getAttribute('width'),
          height: minimapSvg.getAttribute('height'),
          viewBox: minimapSvg.getAttribute('viewBox')
        },
        maskPath: pathData,
        outerRect,
        innerRect,
        pathSegments: pathSegments.map(s => s.trim())
      };
    });
    
    console.log('📊 Angular Mask分析結果:');
    console.log('  SVG尺寸:', maskAnalysis.svgDimensions);
    console.log('  外層矩形 (背景):', maskAnalysis.outerRect);
    console.log('  內層矩形 (視口):', maskAnalysis.innerRect);
    console.log('  完整路徑:', maskAnalysis.maskPath);
    
    // 計算mask覆蓋比例
    if (maskAnalysis.outerRect && maskAnalysis.innerRect) {
      const outerArea = maskAnalysis.outerRect.width * maskAnalysis.outerRect.height;
      const innerArea = maskAnalysis.innerRect.width * maskAnalysis.innerRect.height;
      const visibleRatio = innerArea / outerArea;
      
      console.log(`📐 面積分析:`);
      console.log(`  外層面積: ${outerArea.toFixed(2)}`);
      console.log(`  內層面積: ${innerArea.toFixed(2)}`);
      console.log(`  可見比例: ${(visibleRatio * 100).toFixed(1)}%`);
      
      // React版本的可見比例大約應該是 15-25%
      if (visibleRatio < 0.1) {
        console.log('❌ 可見區域過小 - 這解釋了為什麼mask範圍不正確');
      } else if (visibleRatio > 0.4) {
        console.log('❌ 可見區域過大 - mask可能計算錯誤');
      } else {
        console.log('✅ 可見區域比例合理');
      }
    }
  });

  test('檢查viewBox和boundingRect計算', async ({ page }) => {
    console.log('📐 檢查關鍵計算參數...');
    
    // 使用page.evaluate獲取Angular組件的內部狀態
    const calculationData = await page.evaluate(() => {
      // 檢查是否能獲取到主要flow數據
      const flowContainer = document.querySelector('.react-flow');
      const viewport = document.querySelector('.react-flow__viewport');
      const nodes = Array.from(document.querySelectorAll('.react-flow__node'));
      
      let transform = [0, 0, 1];
      if (viewport) {
        const transformStyle = window.getComputedStyle(viewport).transform;
        const match = transformStyle.match(/matrix\\(([^)]+)\\)/);
        if (match) {
          const values = match[1].split(',').map(v => parseFloat(v.trim()));
          transform = [values[4] || 0, values[5] || 0, values[0] || 1];
        }
      }
      
      const containerRect = flowContainer?.getBoundingClientRect();
      
      return {
        containerSize: {
          width: containerRect?.width || 0,
          height: containerRect?.height || 0
        },
        transform,
        nodeCount: nodes.length,
        nodePositions: nodes.map(node => {
          const rect = node.getBoundingClientRect();
          const style = node.style.transform;
          const match = style.match(/translate\\((.+?)px,\\s*(.+?)px\\)/);
          return {
            id: node.getAttribute('data-id'),
            domRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            transformPos: match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null
          };
        }),
        
        // 計算期望的viewBB (React邏輯)
        expectedViewBB: {
          x: -transform[0] / transform[2],
          y: -transform[1] / transform[2],
          width: (containerRect?.width || 0) / transform[2],
          height: (containerRect?.height || 0) / transform[2]
        }
      };
    });
    
    console.log('📊 關鍵計算數據:');
    console.log('  容器尺寸:', calculationData.containerSize);
    console.log('  變換矩陣:', calculationData.transform);
    console.log('  期望viewBB:', calculationData.expectedViewBB);
    console.log('  節點數量:', calculationData.nodeCount);
    
    // 計算節點邊界
    const nodeBounds = calculationData.nodePositions
      .filter(node => node.transformPos)
      .map(node => ({
        x: node.transformPos!.x,
        y: node.transformPos!.y,
        x2: node.transformPos!.x + 150, // 預設寬度
        y2: node.transformPos!.y + 36   // 預設高度
      }));
    
    if (nodeBounds.length > 0) {
      const minX = Math.min(...nodeBounds.map(b => b.x));
      const minY = Math.min(...nodeBounds.map(b => b.y));
      const maxX = Math.max(...nodeBounds.map(b => b.x2));
      const maxY = Math.max(...nodeBounds.map(b => b.y2));
      
      const expectedNodeBounds = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
      
      console.log('  期望節點邊界:', expectedNodeBounds);
      
      // 這應該幫助我們理解為什麼mask範圍不正確
      const viewBB = calculationData.expectedViewBB;
      const viewBBArea = viewBB.width * viewBB.height;
      const nodeBoundsArea = expectedNodeBounds.width * expectedNodeBounds.height;
      
      console.log(`📏 面積比較:`);
      console.log(`  ViewBB面積: ${viewBBArea.toFixed(2)}`);
      console.log(`  節點邊界面積: ${nodeBoundsArea.toFixed(2)}`);
      console.log(`  比例: ${(nodeBoundsArea / viewBBArea * 100).toFixed(1)}%`);
    }
  });
});