import { test, expect } from '@playwright/test';

/**
 * 調試 viewBB 計算問題
 */
test.describe('Debug ViewBB Calculation', () => {
  
  test('Debug viewport calculation step by step', async ({ page }) => {
    console.log('\n=== ViewBB 計算調試 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 獲取所有相關資訊
    const debugInfo = await page.evaluate(() => {
      // 獲取視口變換資訊
      const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
      const flow = document.querySelector('.react-flow') as HTMLElement;
      const minimap = document.querySelector('minimap div.react-flow__minimap') as HTMLElement;
      const svg = minimap?.querySelector('svg') as SVGElement;
      const mask = minimap?.querySelector('path.react-flow__minimap-mask') as SVGPathElement;
      
      const viewportTransform = viewport?.style.transform || '';
      const translateMatch = viewportTransform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
      const scaleMatch = viewportTransform.match(/scale\(([^)]+)\)/);
      
      const transform = {
        translateX: translateMatch ? parseFloat(translateMatch[1]) : 0,
        translateY: translateMatch ? parseFloat(translateMatch[2]) : 0,
        zoom: scaleMatch ? parseFloat(scaleMatch[1]) : 1
      };
      
      const containerSize = {
        width: flow?.offsetWidth || 0,
        height: flow?.offsetHeight || 0
      };
      
      // 計算預期的 viewBB
      const expectedViewBB = {
        x: -transform.translateX / transform.zoom,
        y: -transform.translateY / transform.zoom,
        width: containerSize.width / transform.zoom,
        height: containerSize.height / transform.zoom
      };
      
      return {
        transform,
        containerSize,
        expectedViewBB,
        svgViewBox: svg?.getAttribute('viewBox'),
        maskPath: mask?.getAttribute('d'),
        minimapSize: {
          width: minimap?.offsetWidth || 0,
          height: minimap?.offsetHeight || 0
        }
      };
    });
    
    console.log('調試資訊:');
    console.log('  視口變換:', debugInfo.transform);
    console.log('  容器尺寸:', debugInfo.containerSize);
    console.log('  預期 viewBB:', debugInfo.expectedViewBB);
    console.log('  SVG viewBox:', debugInfo.svgViewBox);
    console.log('  MiniMap 尺寸:', debugInfo.minimapSize);
    
    // 解析 mask 路徑中的 viewBB
    if (debugInfo.maskPath) {
      const innerRectMatch = debugInfo.maskPath.match(/M([^,]+),([^h]+)h([^v]+)v([^h]+)h[^z]+z$/);
      
      if (innerRectMatch) {
        const actualViewBB = {
          x: parseFloat(innerRectMatch[1]),
          y: parseFloat(innerRectMatch[2]),
          width: parseFloat(innerRectMatch[3]),
          height: parseFloat(innerRectMatch[4])
        };
        
        console.log('  實際 viewBB (從 mask):', actualViewBB);
        
        // 比較差異
        const widthDiff = Math.abs(actualViewBB.width - debugInfo.expectedViewBB.width);
        const heightDiff = Math.abs(actualViewBB.height - debugInfo.expectedViewBB.height);
        
        console.log('  尺寸差異:');
        console.log(`    寬度差異: ${widthDiff.toFixed(2)}`);
        console.log(`    高度差異: ${heightDiff.toFixed(2)}`);
        
        if (widthDiff > 10 || heightDiff > 10) {
          console.log('  ❌ viewBB 尺寸差異過大，需要修正');
        } else {
          console.log('  ✅ viewBB 尺寸差異在可接受範圍內');
        }
      }
    }
    
    // 檢查 viewBox 計算
    if (debugInfo.svgViewBox) {
      const viewBoxParts = debugInfo.svgViewBox.split(' ').map(Number);
      const [vbX, vbY, vbWidth, vbHeight] = viewBoxParts;
      
      console.log('  ViewBox 分析:');
      console.log(`    座標: (${vbX}, ${vbY})`);
      console.log(`    尺寸: ${vbWidth} x ${vbHeight}`);
      
      // 計算縮放比例
      const scaleX = 200 / vbWidth;  // MiniMap 寬度 / viewBox 寬度
      const scaleY = 150 / vbHeight; // MiniMap 高度 / viewBox 高度
      
      console.log(`    MiniMap 縮放比例: scaleX=${scaleX.toFixed(3)}, scaleY=${scaleY.toFixed(3)}`);
    }
  });
});