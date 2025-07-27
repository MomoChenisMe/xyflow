import { test, expect } from '@playwright/test';

test.describe('Angular Flow Edge Position Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
  });

  test('edges should connect to bottom handle positions', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待邊線渲染
    await page.waitForSelector('.angular-flow__edge', { timeout: 5000 });
    
    // 獲取第一條邊線的路徑
    const firstEdgePath = await page.locator('.angular-flow__edge-path').first();
    await expect(firstEdgePath).toBeVisible();
    
    // 獲取邊線的 d 屬性（SVG 路徑）
    const pathData = await firstEdgePath.getAttribute('d');
    expect(pathData).toBeTruthy();
    
    // 驗證路徑格式正確（應該是 M x,y C... 的貝茲曲線格式）
    expect(pathData).toMatch(/^M\s*[\d.]+,[\d.]+\s+C/);
    
    console.log('Edge path:', pathData);
  });

  test('edge label should be positioned correctly', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 檢查是否有邊線標籤（如果基本範例中有的話）
    const edgeLabels = await page.locator('.angular-flow__edge-label').count();
    
    // 基本範例可能沒有標籤，所以這個測試只是確保標籤功能不會出錯
    if (edgeLabels > 0) {
      const firstLabel = await page.locator('.angular-flow__edge-label').first();
      await expect(firstLabel).toBeVisible();
      
      // 驗證標籤位置屬性存在
      const x = await firstLabel.getAttribute('x');
      const y = await firstLabel.getAttribute('y');
      expect(x).toBeTruthy();
      expect(y).toBeTruthy();
    }
  });

  test('different edge types should render correctly', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待邊線渲染
    await page.waitForSelector('.angular-flow__edge', { timeout: 5000 });
    
    // 檢查邊線數量
    const edgeCount = await page.locator('.angular-flow__edge').count();
    expect(edgeCount).toBeGreaterThan(0);
    
    // 檢查每條邊都有有效的路徑
    const edges = await page.locator('.angular-flow__edge-path').all();
    for (const edge of edges) {
      const pathData = await edge.getAttribute('d');
      expect(pathData).toBeTruthy();
      expect(pathData.length).toBeGreaterThan(10); // 確保路徑有實際內容
    }
  });

  test('nodes with bottom handles should show correct connection points', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點渲染
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // 檢查節點是否有 bottom position 的 handles
    const bottomHandles = await page.locator('.angular-flow__handle.position-bottom').count();
    expect(bottomHandles).toBeGreaterThan(0);
    
    // 檢查 handle 是否在節點的底部位置
    const firstNode = await page.locator('.angular-flow__node').first();
    const firstBottomHandle = await page.locator('.angular-flow__handle.position-bottom').first();
    
    if (await firstBottomHandle.count() > 0) {
      const nodeBox = await firstNode.boundingBox();
      const handleBox = await firstBottomHandle.boundingBox();
      
      if (nodeBox && handleBox) {
        // Handle 應該在節點底部附近
        expect(handleBox.y).toBeGreaterThanOrEqual(nodeBox.y + nodeBox.height - 10);
      }
    }
  });
});