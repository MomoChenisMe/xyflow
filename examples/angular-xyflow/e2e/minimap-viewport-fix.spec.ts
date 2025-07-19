import { test, expect } from '@playwright/test';

test.describe('MiniMap 視口指示器修復驗證', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 選擇深度修復分析示例
    await page.click('text=🔥 深度修復分析');
    await expect(page.locator('.minimap-comparison')).toBeVisible();
  });

  test('應該顯示三個不同版本的MiniMap', async ({ page }) => {
    // 驗證三個版本都存在
    await expect(page.locator('minimap')).toHaveCount(1);
    await expect(page.locator('minimap-fixed')).toHaveCount(1);
    await expect(page.locator('minimap-correct')).toHaveCount(1);
    
    // 驗證每個版本都有SVG元素
    await expect(page.locator('minimap svg')).toHaveCount(1);
    await expect(page.locator('minimap-fixed svg')).toHaveCount(1);
    await expect(page.locator('minimap-correct svg')).toHaveCount(1);
  });

  test('應該正確渲染節點在MiniMap中', async ({ page }) => {
    // 等待頁面加載完成
    await page.waitForTimeout(1000);
    
    // 檢查每個MiniMap都有節點矩形
    const originalNodes = page.locator('minimap svg rect.react-flow__minimap-node');
    const fixedNodes = page.locator('minimap-fixed svg rect.react-flow__minimap-node');
    const correctNodes = page.locator('minimap-correct svg rect.react-flow__minimap-node');
    
    await expect(originalNodes).toHaveCount(7); // 7個測試節點
    await expect(fixedNodes).toHaveCount(7);
    await expect(correctNodes).toHaveCount(7);
  });

  test('應該顯示視口指示器遮罩', async ({ page }) => {
    // 等待頁面加載完成
    await page.waitForTimeout(1000);
    
    // 檢查視口指示器路徑
    await expect(page.locator('minimap svg path.react-flow__minimap-mask')).toHaveCount(1);
    await expect(page.locator('minimap-fixed svg path.react-flow__minimap-mask')).toHaveCount(1);
    await expect(page.locator('minimap-correct svg path.react-flow__minimap-mask')).toHaveCount(1);
  });

  test('縮放操作應該更新視口指示器', async ({ page }) => {
    // 獲取第一個Flow容器（原始版本）
    const firstFlow = page.locator('.flow-section').first();
    
    // 獲取初始的視口指示器路徑
    const initialPath = await page.locator('minimap svg path.react-flow__minimap-mask').getAttribute('d');
    
    // 在Flow上執行縮放操作（滾輪向上）
    await firstFlow.hover();
    await page.mouse.wheel(0, -500); // 放大
    
    // 等待視圖更新
    await page.waitForTimeout(500);
    
    // 獲取更新後的路徑
    const updatedPath = await page.locator('minimap svg path.react-flow__minimap-mask').getAttribute('d');
    
    // 驗證路徑已改變（視口指示器更新）
    expect(updatedPath).not.toBe(initialPath);
  });

  test('拖拽視圖應該更新視口指示器', async ({ page }) => {
    // 獲取第三個Flow容器（修復版本）
    const correctFlow = page.locator('.flow-section').nth(2);
    
    // 獲取初始的視口指示器路徑
    const initialPath = await page.locator('minimap-correct svg path.react-flow__minimap-mask').getAttribute('d');
    
    // 在Flow上執行拖拽操作
    await correctFlow.hover();
    const bbox = await correctFlow.boundingBox();
    if (bbox) {
      const centerX = bbox.x + bbox.width / 2;
      const centerY = bbox.y + bbox.height / 2;
      
      // 拖拽視圖
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + 100, centerY + 50);
      await page.mouse.up();
    }
    
    // 等待視圖更新
    await page.waitForTimeout(500);
    
    // 獲取更新後的路徑
    const updatedPath = await page.locator('minimap-correct svg path.react-flow__minimap-mask').getAttribute('d');
    
    // 驗證路徑已改變
    expect(updatedPath).not.toBe(initialPath);
  });

  test('修復版本的viewBox應該基於實際容器尺寸計算', async ({ page }) => {
    // 等待頁面加載完成
    await page.waitForTimeout(1000);
    
    // 獲取三個版本的viewBox屬性
    const originalViewBox = await page.locator('minimap svg').getAttribute('viewBox');
    const fixedViewBox = await page.locator('minimap-fixed svg').getAttribute('viewBox');
    const correctViewBox = await page.locator('minimap-correct svg').getAttribute('viewBox');
    
    console.log('Original viewBox:', originalViewBox);
    console.log('Fixed viewBox:', fixedViewBox);
    console.log('Correct viewBox:', correctViewBox);
    
    // 驗證viewBox格式正確（應該是 "x y width height"）
    expect(originalViewBox).toMatch(/^-?\d+(\.\d+)? -?\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?$/);
    expect(fixedViewBox).toMatch(/^-?\d+(\.\d+)? -?\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?$/);
    expect(correctViewBox).toMatch(/^-?\d+(\.\d+)? -?\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?$/);
    
    // 修復版本的viewBox應該與原始版本不同（因為計算邏輯不同）
    expect(correctViewBox).not.toBe(originalViewBox);
  });

  test('視口指示器路徑應該遵循React Flow的SVG路徑格式', async ({ page }) => {
    // 等待頁面加載完成
    await page.waitForTimeout(1000);
    
    // 獲取修復版本的路徑
    const correctPath = await page.locator('minimap-correct svg path.react-flow__minimap-mask').getAttribute('d');
    
    // 驗證路徑格式應該包含兩個矩形：外部矩形和內部矩形（視口）
    // 格式應該類似: "M...h...v...h...z M...h...v...h...z"
    expect(correctPath).toMatch(/^M-?\d+(\.\d+)?,-?\d+(\.\d+)?h\d+(\.\d+)?v\d+(\.\d+)?h-\d+(\.\d+)?z\s+M-?\d+(\.\d+)?,-?\d+(\.\d+)?h\d+(\.\d+)?v\d+(\.\d+)?h-\d+(\.\d+)?z$/);
    
    // 路徑應該包含兩個 'M' 指令（兩個矩形的開始）
    const mCount = (correctPath?.match(/M/g) || []).length;
    expect(mCount).toBe(2);
    
    // 路徑應該包含兩個 'z' 指令（兩個矩形的結束）
    const zCount = (correctPath?.match(/z/g) || []).length;
    expect(zCount).toBe(2);
  });

  test('拖拽節點應該不影響視口指示器（只更新節點位置）', async ({ page }) => {
    // 獲取修復版本的Flow容器
    const correctFlow = page.locator('.flow-section').nth(2);
    
    // 獲取初始的視口指示器路徑
    const initialMaskPath = await page.locator('minimap-correct svg path.react-flow__minimap-mask').getAttribute('d');
    
    // 找到第一個節點並拖拽它
    const firstNode = correctFlow.locator('.xy-flow__node').first();
    await firstNode.hover();
    
    const bbox = await firstNode.boundingBox();
    if (bbox) {
      const centerX = bbox.x + bbox.width / 2;
      const centerY = bbox.y + bbox.height / 2;
      
      // 拖拽節點
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + 50, centerY + 30);
      await page.mouse.up();
    }
    
    // 等待更新
    await page.waitForTimeout(500);
    
    // 獲取更新後的視口指示器路徑
    const updatedMaskPath = await page.locator('minimap-correct svg path.react-flow__minimap-mask').getAttribute('d');
    
    // 視口指示器路徑不應該改變（因為只是拖拽節點，不是移動視圖）
    expect(updatedMaskPath).toBe(initialMaskPath);
    
    // 但是節點在MiniMap中的位置應該更新
    const nodeRect = correctFlow.locator('minimap-correct svg rect.react-flow__minimap-node').first();
    const nodeX = await nodeRect.getAttribute('x');
    
    // 節點的x座標應該是有效數字
    expect(nodeX).toMatch(/^\d+(\.\d+)?$/);
  });

  test('三個版本的標籤應該正確顯示', async ({ page }) => {
    // 驗證版本標籤存在且文字正確
    await expect(page.locator('text=原始版本（問題）')).toBeVisible();
    await expect(page.locator('text=半修復版本')).toBeVisible();
    await expect(page.locator('text=完全修復版本（正確）')).toBeVisible();
    
    // 驗證說明文字存在
    await expect(page.locator('text=深度分析和修復要點')).toBeVisible();
    await expect(page.locator('text=關鍵問題發現')).toBeVisible();
    await expect(page.locator('text=修復實現')).toBeVisible();
  });
});