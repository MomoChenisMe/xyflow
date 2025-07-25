import { test, expect } from '@playwright/test';

test.describe('Mask Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4201/');
    await page.waitForTimeout(3000);
  });

  test('檢查修復後的Mask範圍', async ({ page }) => {
    console.log('🔍 檢查修復後的mask計算...');
    
    const maskData = await page.evaluate(() => {
      const maskPath = document.querySelector('.react-flow__minimap-mask');
      const svg = document.querySelector('.react-flow__minimap-svg');
      
      if (!maskPath || !svg) {
        return { error: 'Elements not found' };
      }
      
      const pathData = maskPath.getAttribute('d') || '';
      const viewBox = svg.getAttribute('viewBox') || '';
      
      // 解析外層和內層矩形
      const pathSegments = pathData.split('M').filter(s => s.trim());
      let outerRect = null;
      let innerRect = null;
      
      if (pathSegments.length >= 2) {
        // 外層矩形
        const outerMatch = pathSegments[0].match(/(-?[\\d.]+),(-?[\\d.]+)h(-?[\\d.]+)v(-?[\\d.]+)/);
        if (outerMatch) {
          const [, x, y, w, h] = outerMatch.map(Number);
          outerRect = { x, y, width: Math.abs(w), height: Math.abs(h) };
        }
        
        // 內層矩形 (視口)
        const innerMatch = pathSegments[1].match(/(-?[\\d.]+),(-?[\\d.]+)h(-?[\\d.]+)v(-?[\\d.]+)/);
        if (innerMatch) {
          const [, x, y, w, h] = innerMatch.map(Number);
          innerRect = { x, y, width: Math.abs(w), height: Math.abs(h) };
        }
      }
      
      return {
        pathData,
        viewBox,
        outerRect,
        innerRect,
        svgSize: {
          width: svg.getAttribute('width'),
          height: svg.getAttribute('height')
        }
      };
    });
    
    console.log('📊 Mask數據分析:');
    console.log('  SVG尺寸:', maskData.svgSize);
    console.log('  ViewBox:', maskData.viewBox);
    console.log('  外層矩形:', maskData.outerRect);
    console.log('  內層矩形 (視口):', maskData.innerRect);
    
    // 檢查基本結構
    expect(maskData.outerRect).toBeTruthy();
    expect(maskData.innerRect).toBeTruthy();
    
    if (maskData.outerRect && maskData.innerRect) {
      // 計算面積比例
      const outerArea = maskData.outerRect.width * maskData.outerRect.height;
      const innerArea = maskData.innerRect.width * maskData.innerRect.height;
      const visibleRatio = innerArea / outerArea;
      
      console.log(`📐 面積分析:`);
      console.log(`  外層面積: ${outerArea.toFixed(2)}`);
      console.log(`  內層面積: ${innerArea.toFixed(2)}`);
      console.log(`  視口可見比例: ${(visibleRatio * 100).toFixed(1)}%`);
      
      // React版本的合理範圍應該是 10-40%
      if (visibleRatio < 0.05) {
        console.log('❌ 視口範圍過小 - mask可能仍有問題');
      } else if (visibleRatio > 0.6) {
        console.log('❌ 視口範圍過大 - mask計算可能錯誤');
      } else {
        console.log('✅ 視口範圍合理');
      }
      
      // 檢查內層矩形是否在外層矩形內
      const insideX = maskData.innerRect.x >= maskData.outerRect.x && 
                     (maskData.innerRect.x + maskData.innerRect.width) <= (maskData.outerRect.x + maskData.outerRect.width);
      const insideY = maskData.innerRect.y >= maskData.outerRect.y && 
                     (maskData.innerRect.y + maskData.innerRect.height) <= (maskData.outerRect.y + maskData.outerRect.height);
      
      console.log(`📍 位置檢查:`);
      console.log(`  內層在外層X範圍內: ${insideX ? '✅' : '❌'}`);
      console.log(`  內層在外層Y範圍內: ${insideY ? '✅' : '❌'}`);
    }
    
    // 截圖保存以供對比
    await page.screenshot({ 
      path: 'mask-fix-verification.png',
      clip: { x: 0, y: 0, width: 1280, height: 720 }
    });
    
    console.log('📷 截圖已保存: mask-fix-verification.png');
  });
});