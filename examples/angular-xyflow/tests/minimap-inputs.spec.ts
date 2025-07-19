import { test, expect } from '@playwright/test';

test.describe('MiniMap Inputs Debug', () => {
  test('check minimap component inputs', async ({ page }) => {
    await page.goto('/');
    
    // 等待頁面加載
    await page.waitForTimeout(2000);
    
    // 檢查主要流程圖元素
    const flowNodes = await page.locator('.react-flow__node').count();
    console.log('Main flow nodes count:', flowNodes);
    
    // 檢查 angular-flow 組件的內部狀態
    const componentState = await page.evaluate(() => {
      // 獲取 angular-flow 元素
      const angularFlow = document.querySelector('angular-flow');
      if (!angularFlow) return null;
      
      // 嘗試獲取組件實例 (這在生產環境可能不可用)
      const componentInstance = (angularFlow as any).__ngContext__?.[8];
      
      if (componentInstance) {
        return {
          hasNodeLookup: !!componentInstance.nodeLookup,
          hasTransform: !!componentInstance.reactTransform,
          hasContainerWidth: !!componentInstance.containerWidth,
          hasContainerHeight: !!componentInstance.containerHeight,
          // 嘗試獲取值
          nodeLookupSize: componentInstance.nodeLookup?.()?.size,
          transform: componentInstance.reactTransform?.(),
          width: componentInstance.containerWidth?.(),
          height: componentInstance.containerHeight?.()
        };
      }
      
      return null;
    });
    
    console.log('Component state:', componentState);
    
    // 檢查 minimap 內部狀態
    const minimapState = await page.evaluate(() => {
      const minimap = document.querySelector('minimap');
      if (!minimap) return null;
      
      // 獲取 minimap 的計算屬性
      const svg = minimap.querySelector('svg');
      const nodes = minimap.querySelectorAll('.react-flow__minimap-node');
      const mask = minimap.querySelector('.react-flow__minimap-mask');
      
      return {
        svgWidth: svg?.getAttribute('width'),
        svgHeight: svg?.getAttribute('height'),
        svgViewBox: svg?.getAttribute('viewBox'),
        nodeCount: nodes.length,
        maskD: mask?.getAttribute('d'),
        // 檢查 minimap-nodes 組件
        hasMinimapNodes: !!minimap.querySelector('minimap-nodes'),
        minimapNodesContent: minimap.querySelector('minimap-nodes')?.innerHTML
      };
    });
    
    console.log('Minimap state:', minimapState);
    
    // 檢查 CSS 是否正確載入
    const cssLoaded = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.querySelector('.react-flow__minimap') || document.body);
      return {
        position: styles.position,
        width: styles.width,
        height: styles.height,
        backgroundColor: styles.backgroundColor
      };
    });
    
    console.log('CSS styles:', cssLoaded);
    
    // 檢查錯誤
    const errors = await page.evaluate(() => {
      return (window as any).__errors || [];
    });
    
    if (errors.length > 0) {
      console.log('Page errors:', errors);
    }
  });
});