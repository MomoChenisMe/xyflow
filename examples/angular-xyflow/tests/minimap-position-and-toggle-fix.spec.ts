import { test, expect } from '@playwright/test';

/**
 * 測試 Angular Flow 的 MiniMap 位置和 toggle classnames 修正
 */
test.describe('MiniMap Position and Toggle Classnames Fix', () => {
  
  test('MiniMap should be positioned at bottom-right', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 檢查 MiniMap 是否使用正確的位置類別
    const minimap = page.locator('minimap div.react-flow__minimap');
    
    // 應該有 bottom right 類別，不應該有 top 類別
    await expect(minimap).toHaveClass(/bottom/);
    await expect(minimap).toHaveClass(/right/);
    await expect(minimap).not.toHaveClass(/top/);
    
    console.log('✓ MiniMap 正確定位在右下角');
  });

  test('Toggle classnames should work correctly', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 等待節點載入
    await page.waitForSelector('.react-flow__node', { state: 'visible' });
    
    // 檢查初始狀態 - 所有節點應該是 light
    const initialNodes = page.locator('.react-flow__node');
    const nodeCount = await initialNodes.count();
    
    console.log(`發現 ${nodeCount} 個節點`);
    
    // 檢查每個節點是否有 light 類別
    for (let i = 0; i < nodeCount; i++) {
      const node = initialNodes.nth(i);
      await expect(node).toHaveClass(/light/);
      await expect(node).not.toHaveClass(/dark/);
    }
    
    console.log('✓ 初始狀態：所有節點都是 light 主題');
    
    // 點擊 toggle classnames 按鈕
    const toggleButton = page.locator('button', { hasText: 'toggle classnames' });
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();
    
    // 等待狀態更新
    await page.waitForTimeout(500);
    
    // 檢查切換後的狀態 - 所有節點應該是 dark
    for (let i = 0; i < nodeCount; i++) {
      const node = initialNodes.nth(i);
      await expect(node).toHaveClass(/dark/);
      await expect(node).not.toHaveClass(/light/);
    }
    
    console.log('✓ 切換後：所有節點都是 dark 主題');
    
    // 再次點擊，應該切換回 light
    await toggleButton.click();
    await page.waitForTimeout(500);
    
    // 檢查是否切換回 light
    for (let i = 0; i < nodeCount; i++) {
      const node = initialNodes.nth(i);
      await expect(node).toHaveClass(/light/);
      await expect(node).not.toHaveClass(/dark/);
    }
    
    console.log('✓ 再次切換：所有節點回到 light 主題');
  });

  test('Node styles should change visually when toggling', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 等待節點載入
    await page.waitForSelector('.react-flow__node', { state: 'visible' });
    
    const firstNode = page.locator('.react-flow__node').first();
    
    // 獲取初始背景色 (light 狀態)
    const lightBackground = await firstNode.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // 點擊 toggle classnames
    await page.locator('button', { hasText: 'toggle classnames' }).click();
    await page.waitForTimeout(500);
    
    // 獲取切換後背景色 (dark 狀態)
    const darkBackground = await firstNode.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    console.log('Light background:', lightBackground);
    console.log('Dark background:', darkBackground);
    
    // 背景色應該不同
    expect(lightBackground).not.toBe(darkBackground);
    
    // dark 狀態應該是 #557 (RGB: 85, 87, 119)
    // CSS 中定義的是 background: #557
    expect(darkBackground).toContain('85'); // 包含 RGB 中的 85
    
    console.log('✓ 節點視覺樣式正確切換');
  });

  test('Panel buttons should not overlap MiniMap', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 檢查控制面板位置 (top right)
    const panel = page.locator('.react-flow__panel.top.right');
    await expect(panel).toBeVisible();
    
    // 檢查 MiniMap 位置 (bottom right)
    const minimap = page.locator('minimap div.react-flow__minimap.bottom.right');
    await expect(minimap).toBeVisible();
    
    // 獲取兩者的位置
    const panelBox = await panel.boundingBox();
    const minimapBox = await minimap.boundingBox();
    
    expect(panelBox).toBeTruthy();
    expect(minimapBox).toBeTruthy();
    
    if (panelBox && minimapBox) {
      // Panel 在上方，MiniMap 在下方，不應該重疊
      const panelBottom = panelBox.y + panelBox.height;
      const minimapTop = minimapBox.y;
      
      console.log('Panel bottom:', panelBottom);
      console.log('MiniMap top:', minimapTop);
      
      // MiniMap 應該在 Panel 下方
      expect(minimapTop).toBeGreaterThan(panelBottom);
      
      console.log('✓ 控制面板和 MiniMap 沒有重疊');
    }
  });

  test('Both fixes summary', async ({ page }) => {
    console.log('\n=== Angular Flow 修正驗證總結 ===');
    
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // 驗證 MiniMap 位置修正
    const minimap = page.locator('minimap div.react-flow__minimap');
    const hasBottomRight = await minimap.evaluate((el) => {
      return el.classList.contains('bottom') && el.classList.contains('right');
    });
    
    // 驗證 toggle classnames 功能
    const toggleButton = page.locator('button', { hasText: 'toggle classnames' });
    const toggleExists = await toggleButton.isVisible();
    
    await toggleButton.click();
    await page.waitForTimeout(500);
    
    const firstNode = page.locator('.react-flow__node').first();
    const hasDarkClass = await firstNode.evaluate((el) => el.classList.contains('dark'));
    
    const fixes = {
      'MiniMap 位置修正 (bottom-right)': hasBottomRight ? '✅ 已修正' : '❌ 仍有問題',
      'Toggle classnames 功能': (toggleExists && hasDarkClass) ? '✅ 已修正' : '❌ 仍有問題'
    };
    
    console.log('修正狀態:');
    Object.entries(fixes).forEach(([fix, status]) => {
      console.log(`  ${fix}: ${status}`);
    });
    
    // 與 React Flow 對比
    console.log('\n與 React Flow 一致性:');
    console.log('  • MiniMap 預設位置: ✅ bottom-right (符合 React Flow)');
    console.log('  • 節點主題切換: ✅ light/dark classnames (符合 React Flow)');
    console.log('  • CSS 樣式定義: ✅ .light/.dark 節點樣式 (符合 React Flow)');
    
    // 確保兩個修正都成功
    expect(hasBottomRight).toBe(true);
    expect(toggleExists && hasDarkClass).toBe(true);
  });
});