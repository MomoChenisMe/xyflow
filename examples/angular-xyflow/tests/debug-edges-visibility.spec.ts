import { test, expect } from '@playwright/test';

test.describe('Debug Edges Visibility', () => {
  test('check why edges container is hidden', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // 檢查edges容器
    const edgesContainer = page.locator('.react-flow__edges');
    
    // 獲取計算後的樣式
    const computedStyles = await edgesContainer.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        width: computed.width,
        height: computed.height,
        position: computed.position,
        top: computed.top,
        left: computed.left,
        zIndex: computed.zIndex,
        pointerEvents: computed.pointerEvents
      };
    });
    
    console.log('Edges container computed styles:', computedStyles);
    
    // 檢查邊界框
    const boundingBox = await edgesContainer.boundingBox();
    console.log('Edges container bounding box:', boundingBox);
    
    // 檢查是否被遮蓋
    const isVisible = await edgesContainer.isVisible();
    console.log('Is edges container visible:', isVisible);
    
    // 檢查父元素
    const parentStyles = await edgesContainer.locator('xpath=..').evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        overflow: computed.overflow,
        height: computed.height,
        position: computed.position
      };
    });
    
    console.log('Parent container styles:', parentStyles);
    
    // 檢查SVG內容
    const svgs = page.locator('.react-flow__edges svg');
    const svgCount = await svgs.count();
    console.log('SVG count:', svgCount);
    
    if (svgCount > 0) {
      const firstSvg = svgs.first();
      const svgStyles = await firstSvg.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          width: computed.width,
          height: computed.height
        };
      });
      console.log('First SVG styles:', svgStyles);
      
      const svgBox = await firstSvg.boundingBox();
      console.log('First SVG bounding box:', svgBox);
    }
  });
});