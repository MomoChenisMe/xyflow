import { test, expect } from '@playwright/test';

test.describe('MiniMap Debug', () => {
  test('debug minimap rendering', async ({ page }) => {
    await page.goto('/');
    
    // 等待頁面加載
    await page.waitForTimeout(2000);
    
    // 檢查 minimap 元素
    const minimapExists = await page.locator('minimap').count();
    console.log('Minimap element exists:', minimapExists > 0);
    
    // 檢查 react-flow__minimap
    const reactFlowMinimap = await page.locator('.react-flow__minimap').count();
    console.log('React Flow Minimap class exists:', reactFlowMinimap > 0);
    
    // 獲取 minimap HTML
    if (minimapExists > 0) {
      const minimapHTML = await page.locator('minimap').innerHTML();
      console.log('Minimap HTML:', minimapHTML.substring(0, 500));
    }
    
    // 檢查 SVG
    const svg = await page.locator('minimap svg').count();
    console.log('SVG exists in minimap:', svg > 0);
    
    if (svg > 0) {
      const svgAttrs = await page.locator('minimap svg').first().evaluate(el => {
        return {
          width: el.getAttribute('width'),
          height: el.getAttribute('height'),
          viewBox: el.getAttribute('viewBox'),
          className: el.className
        };
      });
      console.log('SVG attributes:', svgAttrs);
    }
    
    // 檢查節點
    const nodes = await page.locator('minimap rect.react-flow__minimap-node').count();
    console.log('Minimap nodes count:', nodes);
    
    // 檢查 mask
    const mask = await page.locator('minimap path.react-flow__minimap-mask').count();
    console.log('Minimap mask exists:', mask > 0);
    
    if (mask > 0) {
      const maskD = await page.locator('minimap path.react-flow__minimap-mask').getAttribute('d');
      console.log('Mask path d:', maskD ? maskD.substring(0, 100) + '...' : 'null');
    }
    
    // 檢查 CSS
    const minimapStyles = await page.locator('minimap').first().evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility,
        width: computed.width,
        height: computed.height
      };
    });
    console.log('Minimap styles:', minimapStyles);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'minimap-debug.png', fullPage: true });
    console.log('Screenshot saved as minimap-debug.png');
  });
});