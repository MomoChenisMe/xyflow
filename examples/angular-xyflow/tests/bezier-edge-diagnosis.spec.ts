import { test, expect } from '@playwright/test';

/**
 * Bezier Edge 診斷測試
 * 專門用於診斷為什麼 bezier 曲線沒有顯示的問題
 */

test.describe('Bezier Edge Diagnosis', () => {
  test.beforeEach(async ({ page }) => {
    // 啟用控制台日誌捕獲
    page.on('console', msg => {
      console.log(`Browser console ${msg.type()}: ${msg.text()}`);
    });
    
    page.on('pageerror', err => {
      console.error('Page error:', err.message);
    });
    
    await page.goto('/');
    await page.waitForSelector('.react-flow', { timeout: 10000 });
  });

  test('diagnose bezier edge rendering structure', async ({ page }) => {
    console.log('=== Starting Bezier Edge Diagnosis ===');
    
    // 1. 檢查基本DOM結構
    const reactFlow = page.locator('.react-flow');
    await expect(reactFlow).toBeVisible();
    
    // 2. 檢查邊容器
    const edgesContainer = page.locator('.react-flow__edges');
    const edgesContainerExists = await edgesContainer.count() > 0;
    console.log(`Edges container exists: ${edgesContainerExists}`);
    
    if (edgesContainerExists) {
      // 獲取edges容器的HTML結構
      const edgesHTML = await edgesContainer.evaluate(el => el.outerHTML.substring(0, 500));
      console.log('Edges container HTML (first 500 chars):', edgesHTML);
    }
    
    // 3. 檢查SVG結構
    const svgs = page.locator('.react-flow__edges svg');
    const svgCount = await svgs.count();
    console.log(`SVG count in edges container: ${svgCount}`);
    
    // 4. 檢查是否有g元素（edge groups）
    const edgeGroups = page.locator('.react-flow__edges svg g[class*="react-flow__edge"]');
    const edgeGroupCount = await edgeGroups.count();
    console.log(`Edge group (g) count: ${edgeGroupCount}`);
    
    // 5. 檢查path元素
    const paths = page.locator('.react-flow__edges path');
    const pathCount = await paths.count();
    console.log(`Path count: ${pathCount}`);
    
    // 6. 詳細檢查每個path
    for (let i = 0; i < Math.min(pathCount, 5); i++) {
      const path = paths.nth(i);
      const d = await path.getAttribute('d');
      const className = await path.getAttribute('class');
      const stroke = await path.evaluate(el => window.getComputedStyle(el).stroke);
      const fill = await path.evaluate(el => window.getComputedStyle(el).fill);
      const opacity = await path.evaluate(el => window.getComputedStyle(el).opacity);
      const display = await path.evaluate(el => window.getComputedStyle(el).display);
      
      console.log(`Path ${i}:`, {
        d: d ? d.substring(0, 100) + '...' : 'NO D ATTRIBUTE',
        className,
        stroke,
        fill,
        opacity,
        display
      });
    }
    
    // 7. 檢查CSS是否正確載入
    const hasXYFlowStyles = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      return styles.some(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          return rules.some(rule => 
            rule.cssText.includes('react-flow__edge') || 
            rule.cssText.includes('xyflow')
          );
        } catch {
          return false;
        }
      });
    });
    console.log(`XYFlow styles loaded: ${hasXYFlowStyles}`);
    
    // 8. 截圖供視覺檢查
    await page.screenshot({ 
      path: `bezier-edge-diagnosis-${Date.now()}.png`,
      fullPage: true 
    });
    
    // 9. 檢查edges數據
    const edgeData = await page.evaluate(() => {
      // 嘗試從React Flow組件獲取edges數據
      const reactFlowEl = document.querySelector('.react-flow');
      if (!reactFlowEl) return null;
      
      // 檢查是否有存儲在元素上的數據
      return {
        dataAttributes: Array.from(reactFlowEl.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .map(attr => ({ name: attr.name, value: attr.value }))
      };
    });
    console.log('Edge data:', edgeData);
    
    // 10. 檢查具體的edge類型
    const bezierEdges = page.locator('[data-testid*="edge-bezier"], [class*="bezier"]');
    const bezierCount = await bezierEdges.count();
    console.log(`Bezier edge elements found: ${bezierCount}`);
    
    // 驗證
    expect(svgCount).toBeGreaterThan(0);
    expect(pathCount).toBeGreaterThan(0);
  });

  test('compare DOM structure with working React example', async ({ page }) => {
    // 獲取Angular實現的DOM結構
    const angularStructure = await page.evaluate(() => {
      const container = document.querySelector('.react-flow__edges');
      if (!container) return 'No edges container';
      
      const getStructure = (el: Element, depth = 0): string => {
        const indent = '  '.repeat(depth);
        let result = `${indent}${el.tagName.toLowerCase()}`;
        
        if (el.id) result += `#${el.id}`;
        if (el.className) result += `.${Array.from(el.classList).join('.')}`;
        
        const dataId = el.getAttribute('data-id');
        if (dataId) result += ` [data-id="${dataId}"]`;
        
        // 對於path元素，顯示d屬性的開頭
        if (el.tagName === 'path') {
          const d = el.getAttribute('d');
          if (d) result += ` [d="${d.substring(0, 30)}..."]`;
        }
        
        result += '\n';
        
        // 遞迴處理子元素
        Array.from(el.children).forEach(child => {
          result += getStructure(child as Element, depth + 1);
        });
        
        return result;
      };
      
      return getStructure(container);
    });
    
    console.log('Angular DOM Structure:\n', angularStructure);
  });

  test('check edge rendering with specific selectors', async ({ page }) => {
    // 等待edges容器
    await page.waitForSelector('.react-flow__edges', { timeout: 5000 });
    
    // 嘗試不同的選擇器找到edges
    const selectors = [
      '.react-flow__edge',
      '.react-flow__edge-path',
      '[class*="edge-path"]',
      'g[class*="edge"]',
      'svg g path',
      '.react-flow__edges svg g',
      '[data-id^="edge"]'
    ];
    
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      console.log(`Selector "${selector}": ${count} elements found`);
      
      if (count > 0) {
        const firstEl = page.locator(selector).first();
        const bbox = await firstEl.boundingBox();
        console.log(`  First element bounding box:`, bbox);
      }
    }
  });

  test('verify edge data and rendering pipeline', async ({ page }) => {
    // 檢查是否有正確的節點用於連接
    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();
    console.log(`Node count: ${nodeCount}`);
    
    // 檢查節點位置（edges需要節點位置來計算路徑）
    for (let i = 0; i < Math.min(nodeCount, 3); i++) {
      const node = nodes.nth(i);
      const bbox = await node.boundingBox();
      const id = await node.getAttribute('data-id');
      console.log(`Node ${id} position:`, bbox);
    }
    
    // 注入診斷腳本
    const diagnostics = await page.evaluate(() => {
      const results: any = {};
      
      // 檢查是否有SVG defs（可能包含markers）
      const defs = document.querySelector('.react-flow__edges defs');
      results.hasMarkerDefs = !!defs;
      if (defs) {
        results.markerCount = defs.querySelectorAll('marker').length;
      }
      
      // 檢查transform
      const viewport = document.querySelector('.react-flow__viewport');
      if (viewport) {
        results.viewportTransform = (viewport as HTMLElement).style.transform;
      }
      
      // 檢查edges容器的尺寸
      const edgesContainer = document.querySelector('.react-flow__edges');
      if (edgesContainer) {
        const rect = edgesContainer.getBoundingClientRect();
        results.edgesContainerSize = {
          width: rect.width,
          height: rect.height
        };
      }
      
      return results;
    });
    
    console.log('Diagnostics:', diagnostics);
  });
});