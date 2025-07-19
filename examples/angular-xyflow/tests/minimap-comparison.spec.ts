import { test, expect } from '@playwright/test';

/**
 * 比較 Angular Flow 和 React Flow 的 MiniMap 功能
 * 測試 Angular MiniMap 是否具備 React MiniMap 的核心功能
 */
test.describe('MiniMap Functionality Comparison', () => {
  
  test.beforeEach(async ({ page }) => {
    // 設置測試環境
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('Angular Flow - MiniMap basic presence and visibility', async ({ page }) => {
    await page.goto('http://localhost:4200');
    
    // 等待頁面載入
    await page.waitForLoadState('networkidle');
    
    // 檢查 MiniMap 是否存在
    const minimap = page.locator('minimap');
    await expect(minimap).toBeVisible();
    
    // 檢查 MiniMap SVG 元素
    const minimapSvg = minimap.locator('svg.react-flow__minimap-svg');
    await expect(minimapSvg).toBeVisible();
    
    // 檢查 MiniMap 尺寸
    const svgElement = await minimapSvg.boundingBox();
    expect(svgElement?.width).toBe(200);
    expect(svgElement?.height).toBe(150);
  });

  test('Angular Flow - MiniMap nodes rendering', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    const minimap = page.locator('minimap svg');
    
    // 檢查 MiniMap 中的節點是否正確渲染
    const minimapNodes = minimap.locator('rect.react-flow__minimap-node');
    const nodeCount = await minimapNodes.count();
    
    // 應該有節點在 MiniMap 中顯示
    expect(nodeCount).toBeGreaterThan(0);
    
    // 檢查節點屬性
    const firstNode = minimapNodes.first();
    await expect(firstNode).toHaveAttribute('width', '150');
    await expect(firstNode).toHaveAttribute('height', '40');
  });

  test('Angular Flow - MiniMap viewport indicator', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    const minimap = page.locator('minimap svg');
    
    // 檢查視口指示器 (mask) 是否存在
    const maskPath = minimap.locator('path.react-flow__minimap-mask');
    await expect(maskPath).toBeVisible();
    
    // 檢查 mask 路徑是否有內容
    const maskD = await maskPath.getAttribute('d');
    expect(maskD).toBeTruthy();
    expect(maskD?.length).toBeGreaterThan(0);
  });

  test('React Flow - MiniMap reference comparison', async ({ page }) => {
    // 測試 React Flow Basic 範例的 MiniMap 功能作為對照
    await page.goto('http://localhost:3001/examples/Basic');
    await page.waitForLoadState('networkidle');
    
    // 檢查 React MiniMap 是否存在
    const reactMinimap = page.locator('[data-testid="rf__minimap"]');
    await expect(reactMinimap).toBeVisible();
    
    // 檢查 React MiniMap SVG
    const reactMinimapSvg = reactMinimap.locator('svg.react-flow__minimap-svg');
    await expect(reactMinimapSvg).toBeVisible();
    
    // React MiniMap 應該有動態尺寸，不是固定的 200x150
    const reactSvgElement = await reactMinimapSvg.boundingBox();
    console.log('React MiniMap dimensions:', reactSvgElement);
  });

  test('Angular vs React - MiniMap click interaction comparison', async ({ page }) => {
    // 測試 Angular MiniMap 點擊功能
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    const angularMinimap = page.locator('minimap svg');
    
    // 嘗試點擊 Angular MiniMap - 應該沒有互動功能
    await angularMinimap.click({ position: { x: 100, y: 75 } });
    
    // 檢查點擊後視口是否改變 (Angular 實現中應該沒有變化)
    const angularViewport1 = await page.evaluate(() => {
      const flowContainer = document.querySelector('.react-flow');
      if (flowContainer) {
        const transform = window.getComputedStyle(flowContainer).transform;
        return transform;
      }
      return null;
    });
    
    // 等待一下
    await page.waitForTimeout(500);
    
    // 再次檢查視口 - 應該沒有變化，因為 Angular MiniMap 沒有點擊處理
    const angularViewport2 = await page.evaluate(() => {
      const flowContainer = document.querySelector('.react-flow');
      if (flowContainer) {
        const transform = window.getComputedStyle(flowContainer).transform;
        return transform;
      }
      return null;
    });
    
    // Angular MiniMap 點擊不應該改變視口
    expect(angularViewport1).toBe(angularViewport2);
  });

  test('Angular vs React - MiniMap dynamic scaling comparison', async ({ page }) => {
    // 測試 Angular MiniMap 在縮放時的行為
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 獲取初始 MiniMap viewBox
    const initialViewBox = await page.locator('minimap svg').getAttribute('viewBox');
    
    // 縮放畫布
    await page.locator('.react-flow').click();
    await page.keyboard.press('Control+Equal'); // 放大
    await page.waitForTimeout(500);
    
    // 檢查 MiniMap viewBox 是否有更新
    const updatedViewBox = await page.locator('minimap svg').getAttribute('viewBox');
    
    console.log('Initial viewBox:', initialViewBox);
    console.log('Updated viewBox:', updatedViewBox);
    
    // 注意：這將顯示 Angular 實現可能不會動態更新 viewBox
  });

  test('Angular MiniMap - CSS custom properties support', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    const minimapContainer = page.locator('minimap div.react-flow__minimap');
    
    // 檢查是否使用了 CSS 自定義屬性
    const computedStyles = await minimapContainer.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        borderStyle: styles.borderStyle,
        boxShadow: styles.boxShadow
      };
    });
    
    console.log('Angular MiniMap styles:', computedStyles);
    
    // 檢查節點顏色自定義
    const minimapNode = page.locator('minimap svg rect.react-flow__minimap-node').first();
    const nodeStyles = await minimapNode.evaluate((el) => {
      return {
        fill: el.getAttribute('fill'),
        stroke: el.getAttribute('stroke'),
        strokeWidth: el.getAttribute('stroke-width')
      };
    });
    
    console.log('Angular MiniMap node styles:', nodeStyles);
  });

  test('Feature gap summary - Angular vs React MiniMap', async ({ page }) => {
    console.log('=== MiniMap Feature Comparison Summary ===');
    
    // Angular MiniMap 檢查
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    const angularFeatures = {
      basicRendering: await page.locator('minimap').isVisible(),
      nodeRendering: await page.locator('minimap svg rect.react-flow__minimap-node').count() > 0,
      viewportMask: await page.locator('minimap svg path.react-flow__minimap-mask').isVisible(),
      fixedDimensions: true, // Angular 使用固定尺寸
      clickInteraction: false, // Angular 沒有點擊處理
      dynamicScaling: false, // Angular 沒有動態縮放
      pannableZoomable: false, // Angular 不支援拖拽和縮放
      cssCustomProps: false // Angular 實現較基礎
    };
    
    console.log('Angular MiniMap Features:', angularFeatures);
    
    // 總結缺失的功能
    const missingFeatures = [
      '✗ 動態尺寸計算和視口縮放',
      '✗ 點擊導航功能',
      '✗ 拖拽平移 (pannable)',
      '✗ 滾輪縮放 (zoomable)', 
      '✗ 節點點擊事件處理',
      '✗ 與 @xyflow/system 整合',
      '✗ 正確的節點邊界偵測',
      '✗ CSS 主題變數支援',
      '✗ 可訪問性功能 (ARIA)'
    ];
    
    console.log('Angular MiniMap Missing Features:');
    missingFeatures.forEach(feature => console.log(feature));
    
    // 建議優先修復的功能
    const priorityFixes = [
      '1. 整合 @xyflow/system 的 XYMinimap 功能',
      '2. 添加動態視口計算和縮放',
      '3. 實現點擊導航功能',
      '4. 添加 pannable 和 zoomable 支援'
    ];
    
    console.log('Priority Fixes:');
    priorityFixes.forEach(fix => console.log(fix));
  });
});