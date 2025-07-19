import { test, expect } from '@playwright/test';

test.describe('MiniMap Element Check', () => {
  test('check minimap element structure and computed values', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // 檢查是否有錯誤
    const errors = await page.evaluate(() => {
      return (window as any).ng?.getComponent(document.querySelector('minimap'));
    });
    console.log('Angular component instance:', errors);
    
    // 直接檢查 DOM 結構
    const minimapStructure = await page.evaluate(() => {
      const minimap = document.querySelector('minimap');
      if (!minimap) return null;
      
      const svg = minimap.querySelector('svg');
      const minimapNodes = minimap.querySelector('minimap-nodes');
      const maskPath = minimap.querySelector('.react-flow__minimap-mask');
      
      return {
        minimap: {
          exists: true,
          innerHTML: minimap.innerHTML.substring(0, 200),
          attributes: Array.from(minimap.attributes).map(attr => ({
            name: attr.name,
            value: attr.value
          }))
        },
        svg: {
          exists: !!svg,
          attributes: svg ? {
            width: svg.getAttribute('width'),
            height: svg.getAttribute('height'),
            viewBox: svg.getAttribute('viewBox'),
            'aria-labelledby': svg.getAttribute('aria-labelledby'),
            role: svg.getAttribute('role')
          } : null
        },
        minimapNodes: {
          exists: !!minimapNodes,
          innerHTML: minimapNodes?.innerHTML,
          childCount: minimapNodes?.children.length
        },
        maskPath: {
          exists: !!maskPath,
          d: maskPath?.getAttribute('d'),
          fillRule: maskPath?.getAttribute('fill-rule'),
          pointerEvents: maskPath?.getAttribute('pointer-events')
        }
      };
    });
    
    console.log('MiniMap structure:', JSON.stringify(minimapStructure, null, 2));
    
    // 檢查 Angular Flow 組件
    const angularFlowState = await page.evaluate(() => {
      const angularFlow = document.querySelector('angular-flow');
      if (!angularFlow) return null;
      
      // 檢查是否有節點
      const nodes = angularFlow.querySelectorAll('.react-flow__node');
      return {
        nodeCount: nodes.length,
        nodePositions: Array.from(nodes).slice(0, 2).map((node: any) => ({
          id: node.getAttribute('data-id'),
          transform: node.style.transform
        }))
      };
    });
    
    console.log('Angular Flow state:', angularFlowState);
    
    // 期望檢查
    expect(minimapStructure).not.toBeNull();
    expect(minimapStructure?.minimap.exists).toBe(true);
    expect(minimapStructure?.svg.exists).toBe(true);
    expect(minimapStructure?.minimapNodes.exists).toBe(true);
    expect(minimapStructure?.maskPath.exists).toBe(true);
  });
});