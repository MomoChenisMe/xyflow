import { test, expect } from '@playwright/test';

/**
 * Edge Fix Verification Test
 * 驗證邊緣容器修復後的高度問題
 */

test.describe('Edge Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.react-flow', { timeout: 10000 });
  });

  test('verify edges container has correct dimensions after fix', async ({ page }) => {
    // 等待edges容器出現
    const edgesContainer = page.locator('.react-flow__edges');
    await expect(edgesContainer).toBeVisible();
    
    // 檢查edges容器的尺寸
    const edgesBox = await edgesContainer.boundingBox();
    console.log('Edges container bounding box:', edgesBox);
    
    // 驗證容器有正確的尺寸
    expect(edgesBox).not.toBeNull();
    expect(edgesBox!.width).toBeGreaterThan(0);
    expect(edgesBox!.height).toBeGreaterThan(0);
    
    // 檢查邊是否可見
    const edgePaths = page.locator('.react-flow__edge-path');
    const pathCount = await edgePaths.count();
    console.log(`Edge paths found: ${pathCount}`);
    
    expect(pathCount).toBeGreaterThan(0);
    
    // 檢查第一條邊的可見性
    if (pathCount > 0) {
      const firstPath = edgePaths.first();
      const pathBox = await firstPath.boundingBox();
      console.log('First edge path bounding box:', pathBox);
      
      expect(pathBox).not.toBeNull();
      expect(pathBox!.width).toBeGreaterThan(0);
      expect(pathBox!.height).toBeGreaterThan(0);
    }
    
    // 截圖驗證視覺效果
    await page.screenshot({ 
      path: `edge-fix-verification-${Date.now()}.png`,
      fullPage: true 
    });
  });

  test('verify bezier curves are properly rendered', async ({ page }) => {
    // 檢查所有path元素
    const paths = page.locator('.react-flow__edge-path');
    const pathCount = await paths.count();
    
    for (let i = 0; i < pathCount; i++) {
      const path = paths.nth(i);
      const d = await path.getAttribute('d');
      
      console.log(`Path ${i} d attribute:`, d);
      
      // 驗證bezier曲線路徑格式
      expect(d).toBeTruthy();
      expect(d).toMatch(/^M\s+[\d.-]+\s+[\d.-]+\s+C\s+[\d.-]+\s+[\d.-]+,\s+[\d.-]+\s+[\d.-]+,\s+[\d.-]+\s+[\d.-]+$/);
      
      // 檢查stroke樣式
      const stroke = await path.evaluate(el => window.getComputedStyle(el).stroke);
      console.log(`Path ${i} stroke:`, stroke);
      expect(stroke).not.toBe('');
      expect(stroke).not.toBe('rgba(0, 0, 0, 0)');
    }
  });
});