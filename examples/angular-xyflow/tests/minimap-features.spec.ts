import { test, expect } from '@playwright/test';

/**
 * 專門測試 Angular MiniMap 功能的測試套件
 * 對比 React Flow 參考實現，識別功能差異
 */
test.describe('Angular MiniMap 功能測試', () => {
  
  test('MiniMap 基本顯示和結構', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 檢查 MiniMap 組件存在
    const minimap = page.locator('minimap');
    await expect(minimap).toBeVisible();
    
    // 檢查 MiniMap 容器類別
    const minimapContainer = minimap.locator('div.react-flow__minimap');
    await expect(minimapContainer).toBeVisible();
    await expect(minimapContainer).toHaveClass(/react-flow__panel/);
    await expect(minimapContainer).toHaveClass(/top/);
    await expect(minimapContainer).toHaveClass(/right/);
    
    // 檢查 SVG 元素
    const svg = minimap.locator('svg.react-flow__minimap-svg');
    await expect(svg).toBeVisible();
    await expect(svg).toHaveAttribute('width', '200');
    await expect(svg).toHaveAttribute('height', '150');
    
    console.log('✓ Angular MiniMap 基本結構正確');
  });

  test('MiniMap 節點渲染測試', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    const minimap = page.locator('minimap svg');
    
    // 檢查節點是否渲染
    const nodes = minimap.locator('rect.react-flow__minimap-node');
    const nodeCount = await nodes.count();
    
    expect(nodeCount).toBeGreaterThan(0);
    console.log(`✓ MiniMap 渲染了 ${nodeCount} 個節點`);
    
    // 檢查第一個節點的屬性
    const firstNode = nodes.first();
    const nodeAttrs = {
      width: await firstNode.getAttribute('width'),
      height: await firstNode.getAttribute('height'),
      fill: await firstNode.getAttribute('fill'),
      rx: await firstNode.getAttribute('rx'),
      stroke: await firstNode.getAttribute('stroke'),
      strokeWidth: await firstNode.getAttribute('stroke-width')
    };
    
    console.log('節點屬性:', nodeAttrs);
    
    // 驗證固定尺寸問題
    expect(nodeAttrs.width).toBe('150');
    expect(nodeAttrs.height).toBe('40');
    console.log('⚠️  Angular MiniMap 使用固定節點尺寸 (React 版本使用動態尺寸)');
  });

  test('MiniMap 視口指示器測試', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    const minimap = page.locator('minimap svg');
    const mask = minimap.locator('path.react-flow__minimap-mask');
    
    await expect(mask).toBeVisible();
    
    const maskPath = await mask.getAttribute('d');
    expect(maskPath).toBeTruthy();
    expect(maskPath?.length).toBeGreaterThan(10);
    
    console.log('✓ 視口指示器正確渲染');
    console.log('Mask path preview:', maskPath?.substring(0, 50) + '...');
  });

  test('MiniMap 互動功能測試 (預期失敗)', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 記錄初始視口位置
    const initialTransform = await page.evaluate(() => {
      const flow = document.querySelector('.react-flow');
      return flow ? window.getComputedStyle(flow).transform : null;
    });
    
    // 嘗試點擊 MiniMap
    const minimap = page.locator('minimap svg');
    await minimap.click({ position: { x: 100, y: 75 } });
    
    await page.waitForTimeout(500);
    
    // 檢查視口是否改變
    const afterClickTransform = await page.evaluate(() => {
      const flow = document.querySelector('.react-flow');
      return flow ? window.getComputedStyle(flow).transform : null;
    });
    
    // Angular 版本應該沒有互動功能
    expect(initialTransform).toBe(afterClickTransform);
    console.log('⚠️  Angular MiniMap 沒有點擊導航功能 (React 版本支援)');
  });

  test('MiniMap 在畫布縮放時的行為', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 獲取初始 viewBox
    const initialViewBox = await page.locator('minimap svg').getAttribute('viewBox');
    
    // 縮放畫布
    const flow = page.locator('.react-flow');
    await flow.click();
    
    // 滾輪縮放
    await flow.hover();
    await page.wheel(0, -300); // 放大
    await page.waitForTimeout(500);
    
    // 檢查 viewBox 是否更新
    const updatedViewBox = await page.locator('minimap svg').getAttribute('viewBox');
    
    console.log('縮放前 viewBox:', initialViewBox);
    console.log('縮放後 viewBox:', updatedViewBox);
    
    if (initialViewBox === updatedViewBox) {
      console.log('⚠️  Angular MiniMap viewBox 沒有隨縮放更新 (React 版本會動態更新)');
    } else {
      console.log('✓ Angular MiniMap viewBox 正確更新');
    }
  });

  test('與 React Flow 參考實現比較', async ({ page, context }) => {
    // 在新頁面開啟 React Flow 範例進行比較
    const reactPage = await context.newPage();
    
    try {
      await reactPage.goto('http://localhost:3001/examples/Basic');
      await reactPage.waitForLoadState('networkidle');
      
      // 檢查 React MiniMap
      const reactMinimap = reactPage.locator('[data-testid="rf__minimap"]');
      const reactMinimapExists = await reactMinimap.isVisible();
      
      if (reactMinimapExists) {
        const reactSvg = reactMinimap.locator('svg');
        const reactBounds = await reactSvg.boundingBox();
        
        console.log('React MiniMap 尺寸:', reactBounds);
        
        // 檢查 React MiniMap 節點
        const reactNodes = reactSvg.locator('rect');
        const reactNodeCount = await reactNodes.count();
        
        console.log(`React MiniMap 節點數: ${reactNodeCount}`);
        
        // 比較功能
        console.log('=== 功能比較 ===');
        console.log('Angular MiniMap: 基本顯示 ✓, 固定尺寸 ⚠️, 無互動 ✗');
        console.log('React MiniMap: 基本顯示 ✓, 動態尺寸 ✓, 完整互動 ✓');
      } else {
        console.log('⚠️  無法載入 React Flow 參考實現進行比較');
      }
    } catch (error) {
      console.log('⚠️  React Flow 服務未運行，跳過比較測試');
    } finally {
      await reactPage.close();
    }
  });

  test('Angular MiniMap 功能缺口分析', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    console.log('\n=== Angular MiniMap 功能缺口分析 ===');
    
    // 檢查現有功能
    const currentFeatures = {
      '基本渲染': await page.locator('minimap').isVisible(),
      '節點顯示': await page.locator('minimap svg rect').count() > 0,
      '視口指示器': await page.locator('minimap svg path.react-flow__minimap-mask').isVisible(),
    };
    
    console.log('現有功能:');
    Object.entries(currentFeatures).forEach(([feature, exists]) => {
      console.log(`  ${exists ? '✓' : '✗'} ${feature}`);
    });
    
    console.log('\n缺失的關鍵功能:');
    const missingFeatures = [
      '動態節點尺寸計算 (目前使用固定 150x40)',
      '點擊導航到對應區域',
      'pannable 拖拽平移功能', 
      'zoomable 滾輪縮放功能',
      '節點點擊事件處理',
      '動態 viewBox 縮放計算',
      '與 @xyflow/system 整合',
      'CSS 自定義屬性支援',
      '可訪問性 (ARIA) 支援'
    ];
    
    missingFeatures.forEach((feature, index) => {
      console.log(`  ${index + 1}. ${feature}`);
    });
    
    console.log('\n建議修復優先順序:');
    const priorities = [
      '高: 整合 @xyflow/system 的 XYMinimap 核心功能',
      '高: 實現動態節點尺寸和視口計算', 
      '中: 添加點擊導航功能',
      '中: 支援 pannable 和 zoomable 選項',
      '低: CSS 主題化和可訪問性改進'
    ];
    
    priorities.forEach(priority => {
      console.log(`  • ${priority}`);
    });
  });
});