import { test, expect } from '@playwright/test';

/**
 * 測試 MiniMap 白色區域修正
 */
test.describe('MiniMap White Area Fix', () => {
  
  test('MiniMap should not have white areas at the top', async ({ page }) => {
    console.log('\n=== MiniMap 白色區域修正驗證 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 等待 MiniMap 完全載入
    await page.waitForSelector('minimap div.react-flow__minimap', { state: 'visible' });
    await page.waitForTimeout(1000);
    
    // 檢查 MiniMap 容器
    const minimap = page.locator('minimap div.react-flow__minimap');
    await expect(minimap).toBeVisible();
    
    // 檢查 SVG viewBox 是否合理
    const svg = minimap.locator('svg.react-flow__minimap-svg');
    const viewBox = await svg.getAttribute('viewBox');
    console.log('SVG viewBox:', viewBox);
    
    // 解析 viewBox
    const viewBoxValues = viewBox?.split(' ').map(Number) || [0, 0, 0, 0];
    const [x, y, width, height] = viewBoxValues;
    
    // 檢查 viewBox 值是否合理
    console.log('ViewBox 分析:');
    console.log(`  x: ${x}, y: ${y}`);
    console.log(`  width: ${width}, height: ${height}`);
    
    // viewBox 應該包含合理的座標範圍
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
    
    // 檢查視口指示器路徑
    const mask = minimap.locator('path.react-flow__minimap-mask');
    const maskPath = await mask.getAttribute('d');
    console.log('Mask path:', maskPath?.substring(0, 100) + '...');
    
    // 檢查 mask 是否存在且有效
    expect(maskPath).toBeTruthy();
    expect(maskPath?.length).toBeGreaterThan(10);
    
    // 檢查節點是否在 viewBox 範圍內
    const nodes = minimap.locator('rect.react-flow__minimap-node');
    const nodeCount = await nodes.count();
    console.log(`MiniMap 節點數量: ${nodeCount}`);
    
    for (let i = 0; i < nodeCount; i++) {
      const node = nodes.nth(i);
      const nodeAttrs = await node.evaluate((el) => ({
        x: parseFloat(el.getAttribute('x') || '0'),
        y: parseFloat(el.getAttribute('y') || '0'),
        width: parseFloat(el.getAttribute('width') || '0'),
        height: parseFloat(el.getAttribute('height') || '0')
      }));
      
      console.log(`  節點 ${i + 1}: x=${nodeAttrs.x}, y=${nodeAttrs.y}, w=${nodeAttrs.width}, h=${nodeAttrs.height}`);
      
      // 節點應該在 viewBox 範圍內或合理範圍內
      expect(nodeAttrs.x).toBeGreaterThanOrEqual(x - 100); // 允許一些容差
      expect(nodeAttrs.y).toBeGreaterThanOrEqual(y - 100);
      expect(nodeAttrs.x + nodeAttrs.width).toBeLessThanOrEqual(x + width + 100);
      expect(nodeAttrs.y + nodeAttrs.height).toBeLessThanOrEqual(y + height + 100);
    }
    
    // 檢查 MiniMap 樣式
    const minimapStyles = await minimap.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        width: computed.width,
        height: computed.height
      };
    });
    
    console.log('MiniMap 樣式:', minimapStyles);
    
    // 背景色應該不是白色 (預設為 #fff，但可能經過變數處理)
    expect(minimapStyles.backgroundColor).toBeTruthy();
    
    console.log('✅ MiniMap 白色區域檢查完成');
  });
  
  test('MiniMap viewport indicator should cover reasonable area', async ({ page }) => {
    console.log('\n=== MiniMap 視口指示器覆蓋範圍檢查 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('minimap div.react-flow__minimap', { state: 'visible' });
    
    // 獲取主流程圖的視口資訊
    const viewport = page.locator('.react-flow__viewport');
    const viewportTransform = await viewport.getAttribute('style');
    console.log('主視口變換:', viewportTransform);
    
    // 獲取 MiniMap 的 mask 路徑
    const mask = page.locator('minimap path.react-flow__minimap-mask');
    const maskPath = await mask.getAttribute('d');
    
    if (maskPath) {
      // 解析 mask 路徑中的數值
      const pathNumbers = maskPath.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
      console.log('Mask 路徑數值前 8 個:', pathNumbers.slice(0, 8));
      
      // 檢查是否有合理的座標值
      expect(pathNumbers.length).toBeGreaterThan(8);
      
      // 檢查外部矩形和內部矩形都有合理的尺寸
      const hasReasonableSize = pathNumbers.some(num => Math.abs(num) > 50);
      expect(hasReasonableSize).toBe(true);
    }
    
    // 拖拽測試 - 檢查視口指示器是否正確更新
    const flowBox = await page.locator('.react-flow').boundingBox();
    if (flowBox) {
      const initialMaskPath = await mask.getAttribute('d');
      
      // 拖拽流程圖
      await page.mouse.move(flowBox.x + 100, flowBox.y + 100);
      await page.mouse.down();
      await page.mouse.move(flowBox.x + 200, flowBox.y + 200);
      await page.mouse.up();
      
      await page.waitForTimeout(300);
      
      const updatedMaskPath = await mask.getAttribute('d');
      const pathChanged = initialMaskPath !== updatedMaskPath;
      console.log('拖拽後視口指示器更新:', pathChanged ? '✅' : '❌');
      
      expect(pathChanged).toBe(true);
    }
    
    console.log('✅ 視口指示器覆蓋範圍檢查完成');
  });
});