import { test, expect } from '@playwright/test';

/**
 * 調查 Angular 和 React MiniMap 的顏色差異
 */
test.describe('MiniMap Color Investigation', () => {
  
  test('Angular MiniMap node colors analysis', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 檢查 MiniMap 節點
    const minimapNodes = page.locator('minimap svg rect.react-flow__minimap-node');
    const nodeCount = await minimapNodes.count();
    
    console.log(`Angular MiniMap 節點數量: ${nodeCount}`);
    
    if (nodeCount > 0) {
      const firstNode = minimapNodes.first();
      
      // 獲取節點的樣式屬性
      const nodeStyles = await firstNode.evaluate((el) => ({
        fill: el.getAttribute('fill'),
        stroke: el.getAttribute('stroke'),
        strokeWidth: el.getAttribute('stroke-width'),
        rx: el.getAttribute('rx'),
        width: el.getAttribute('width'),
        height: el.getAttribute('height'),
        computedFill: window.getComputedStyle(el).fill,
        computedStroke: window.getComputedStyle(el).stroke
      }));
      
      console.log('Angular MiniMap 節點樣式:');
      console.log(JSON.stringify(nodeStyles, null, 2));
      
      // 檢查 CSS 變數
      const cssVariables = await page.evaluate(() => {
        const minimap = document.querySelector('minimap');
        if (!minimap) return {};
        
        const computedStyle = window.getComputedStyle(minimap);
        return {
          '--xy-minimap-node-background-color-default': computedStyle.getPropertyValue('--xy-minimap-node-background-color-default'),
          '--xy-minimap-node-stroke-color-default': computedStyle.getPropertyValue('--xy-minimap-node-stroke-color-default'),
          '--xy-minimap-node-stroke-width-default': computedStyle.getPropertyValue('--xy-minimap-node-stroke-width-default'),
          '--xy-minimap-background-color-default': computedStyle.getPropertyValue('--xy-minimap-background-color-default')
        };
      });
      
      console.log('Angular CSS 變數:');
      console.log(JSON.stringify(cssVariables, null, 2));
    }
  });

  test('Main flow node colors for comparison', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 檢查主要畫布上的節點顏色
    const mainNodes = page.locator('.react-flow__node');
    const nodeCount = await mainNodes.count();
    
    console.log(`主畫布節點數量: ${nodeCount}`);
    
    if (nodeCount > 0) {
      const firstNode = mainNodes.first();
      
      const nodeStyles = await firstNode.evaluate((el) => ({
        className: el.className,
        computedBackground: window.getComputedStyle(el).backgroundColor,
        computedColor: window.getComputedStyle(el).color,
        computedBorder: window.getComputedStyle(el).border
      }));
      
      console.log('主畫布節點樣式:');
      console.log(JSON.stringify(nodeStyles, null, 2));
    }
  });

  test('React MiniMap colors for comparison', async ({ page, context }) => {
    // 嘗試連接到 React 範例進行比較
    const reactPage = await context.newPage();
    
    try {
      await reactPage.goto('http://localhost:3001/examples/Basic');
      await reactPage.waitForLoadState('networkidle');
      
      // 檢查 React MiniMap
      const reactMinimap = reactPage.locator('[data-testid="rf__minimap"]');
      const reactMinimapExists = await reactMinimap.isVisible();
      
      if (reactMinimapExists) {
        // 檢查 React MiniMap 節點
        const reactMinimapNodes = reactMinimap.locator('rect');
        const reactNodeCount = await reactMinimapNodes.count();
        
        console.log(`React MiniMap 節點數量: ${reactNodeCount}`);
        
        if (reactNodeCount > 0) {
          // 找到實際的 minimap 節點 (跳過 mask path)
          const reactMinimapNode = reactMinimapNodes.last(); // 通常最後的 rect 是節點
          
          const reactNodeStyles = await reactMinimapNode.evaluate((el) => ({
            fill: el.getAttribute('fill'),
            stroke: el.getAttribute('stroke'),
            strokeWidth: el.getAttribute('stroke-width'),
            rx: el.getAttribute('rx'),
            className: el.className.baseVal || el.className,
            computedFill: window.getComputedStyle(el).fill,
            computedStroke: window.getComputedStyle(el).stroke
          }));
          
          console.log('React MiniMap 節點樣式:');
          console.log(JSON.stringify(reactNodeStyles, null, 2));
        }
        
        // 檢查 React 主節點顏色
        const reactMainNodes = reactPage.locator('.react-flow__node');
        const reactMainNodeCount = await reactMainNodes.count();
        
        if (reactMainNodeCount > 0) {
          const reactFirstNode = reactMainNodes.first();
          
          const reactMainNodeStyles = await reactFirstNode.evaluate((el) => ({
            className: el.className,
            computedBackground: window.getComputedStyle(el).backgroundColor,
            computedColor: window.getComputedStyle(el).color
          }));
          
          console.log('React 主畫布節點樣式:');
          console.log(JSON.stringify(reactMainNodeStyles, null, 2));
        }
      } else {
        console.log('React MiniMap 不可見');
      }
    } catch (error) {
      console.log('無法連接 React 範例:', error.message);
    } finally {
      await reactPage.close();
    }
  });

  test('MiniMap background and mask colors', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 檢查 MiniMap 背景
    const minimapContainer = page.locator('minimap div.react-flow__minimap');
    const minimapBg = await minimapContainer.evaluate((el) => ({
      backgroundColor: window.getComputedStyle(el).backgroundColor,
      border: window.getComputedStyle(el).border,
      boxShadow: window.getComputedStyle(el).boxShadow
    }));
    
    console.log('Angular MiniMap 容器樣式:');
    console.log(JSON.stringify(minimapBg, null, 2));
    
    // 檢查 mask
    const mask = page.locator('minimap svg path.react-flow__minimap-mask');
    const maskExists = await mask.isVisible();
    
    if (maskExists) {
      const maskStyles = await mask.evaluate((el) => ({
        fill: el.getAttribute('fill'),
        stroke: el.getAttribute('stroke'),
        strokeWidth: el.getAttribute('stroke-width'),
        computedFill: window.getComputedStyle(el).fill,
        computedStroke: window.getComputedStyle(el).stroke
      }));
      
      console.log('Angular MiniMap mask 樣式:');
      console.log(JSON.stringify(maskStyles, null, 2));
    }
  });
});