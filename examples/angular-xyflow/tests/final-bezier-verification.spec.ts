import { test, expect } from '@playwright/test';

/**
 * Final Bezier Curve Verification
 * 最終驗證Angular Flow的bezier曲線功能完全正常
 */

test.describe('Final Bezier Curve Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.react-flow', { timeout: 10000 });
  });

  test('complete bezier curve functionality test', async ({ page }) => {
    console.log('=== Final Bezier Curve Verification ===');
    
    // 1. 驗證基本結構
    await expect(page.locator('.react-flow')).toBeVisible();
    await expect(page.locator('.react-flow__edges')).toBeVisible();
    
    // 2. 驗證邊緣數量
    const edgePaths = page.locator('.react-flow__edge-path');
    const edgeCount = await edgePaths.count();
    console.log(`Total edge paths: ${edgeCount}`);
    expect(edgeCount).toBe(2);
    
    // 3. 驗證每條邊的bezier路徑
    const expectedPaths = [
      /^M\s+400\s+25\s+C\s+478\.67.*25,\s+21\.32.*120,\s+100\s+120$/,
      /^M\s+400\s+25\s+C\s+423\.75\s+25,\s+376\.25\s+120,\s+400\s+120$/
    ];
    
    for (let i = 0; i < edgeCount; i++) {
      const path = edgePaths.nth(i);
      const d = await path.getAttribute('d');
      const stroke = await path.evaluate(el => window.getComputedStyle(el).stroke);
      
      console.log(`Edge ${i + 1}:`);
      console.log(`  Path: ${d}`);
      console.log(`  Stroke: ${stroke}`);
      
      // 驗證路徑格式
      expect(d).toBeTruthy();
      expect(d).toMatch(expectedPaths[i]);
      
      // 驗證樣式
      expect(stroke).toBe('rgb(177, 177, 183)');
      
      // 驗證可見性
      const bbox = await path.boundingBox();
      expect(bbox).not.toBeNull();
      expect(bbox!.width).toBeGreaterThan(0);
      expect(bbox!.height).toBeGreaterThan(0);
    }
    
    // 4. 驗證邊緣互動功能
    const firstEdge = page.locator('.react-flow__edge').first();
    await firstEdge.click();
    
    // 檢查是否有選中狀態
    await expect(firstEdge).toHaveClass(/selected/);
    
    // 5. 驗證動畫邊緣
    const animatedEdge = page.locator('.react-flow__edge.animated');
    const animatedCount = await animatedEdge.count();
    console.log(`Animated edges: ${animatedCount}`);
    expect(animatedCount).toBeGreaterThan(0);
    
    // 6. 最終截圖
    await page.screenshot({ 
      path: `final-bezier-verification-${Date.now()}.png`,
      fullPage: true 
    });
    
    console.log('✅ All bezier curve functionality verified successfully!');
  });

  test('performance and visual quality check', async ({ page }) => {
    // 測試bezier曲線的渲染性能
    const startTime = Date.now();
    
    await page.waitForSelector('.react-flow__edge-path');
    
    const loadTime = Date.now() - startTime;
    console.log(`Edge rendering time: ${loadTime}ms`);
    
    // 確保渲染時間合理（小於1秒）
    expect(loadTime).toBeLessThan(1000);
    
    // 檢查曲線的視覺質量（無鋸齒等）
    const paths = page.locator('.react-flow__edge-path');
    const pathCount = await paths.count();
    
    for (let i = 0; i < pathCount; i++) {
      const path = paths.nth(i);
      const strokeWidth = await path.evaluate(el => window.getComputedStyle(el).strokeWidth);
      
      // 確保線條寬度合理
      expect(parseFloat(strokeWidth)).toBe(1);
    }
  });

  test('edge selection and interaction', async ({ page }) => {
    // 測試邊緣的點擊和選擇功能
    const edges = page.locator('.react-flow__edge');
    const edgeCount = await edges.count();
    
    expect(edgeCount).toBe(2);
    
    // 測試點擊第一條邊
    const firstEdge = edges.first();
    await firstEdge.click();
    await expect(firstEdge).toHaveClass(/selected/);
    
    // 測試點擊第二條邊（應該取消第一條的選擇）
    const secondEdge = edges.nth(1);
    await secondEdge.click();
    await expect(secondEdge).toHaveClass(/selected/);
    await expect(firstEdge).not.toHaveClass(/selected/);
    
    // 測試點擊空白處取消選擇
    await page.locator('.react-flow__pane').click({ position: { x: 50, y: 50 } });
    await expect(firstEdge).not.toHaveClass(/selected/);
    await expect(secondEdge).not.toHaveClass(/selected/);
  });
});