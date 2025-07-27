import { test, expect } from '@playwright/test';

test.describe('Angular Flow Node Types Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
  });

  test('should display different node types correctly', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點渲染
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // 檢查是否有不同類型的節點
    const inputNodes = await page.locator('.angular-flow__node.type-input').count();
    const defaultNodes = await page.locator('.angular-flow__node.type-default').count();
    const outputNodes = await page.locator('.angular-flow__node.type-output').count();
    
    console.log('Node types found:', { inputNodes, defaultNodes, outputNodes });
    
    // 應該至少有一個 input 節點
    expect(inputNodes).toBeGreaterThan(0);
    
    // 應該至少有一個 output 節點
    expect(outputNodes).toBeGreaterThan(0);
    
    // 總節點數應該是 4
    const totalNodes = await page.locator('.angular-flow__node').count();
    expect(totalNodes).toBe(4);
  });

  test('input nodes should only have source handles', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點渲染
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // 獲取第一個 input 節點
    const inputNode = await page.locator('.angular-flow__node.type-input').first();
    
    if (await inputNode.count() > 0) {
      // Input 節點應該有 source handle
      const sourceHandles = await inputNode.locator('angular-flow-handle[type="source"]').count();
      expect(sourceHandles).toBeGreaterThan(0);
      
      // Input 節點不應該有 target handle
      const targetHandles = await inputNode.locator('angular-flow-handle[type="target"]').count();
      expect(targetHandles).toBe(0);
    }
  });

  test('output nodes should only have target handles', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點渲染
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // 獲取第一個 output 節點
    const outputNode = await page.locator('.angular-flow__node.type-output').first();
    
    if (await outputNode.count() > 0) {
      // Output 節點應該有 target handle
      const targetHandles = await outputNode.locator('angular-flow-handle[type="target"]').count();
      expect(targetHandles).toBeGreaterThan(0);
      
      // Output 節點不應該有 source handle
      const sourceHandles = await outputNode.locator('angular-flow-handle[type="source"]').count();
      expect(sourceHandles).toBe(0);
    }
  });

  test('default nodes should have both source and target handles', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點渲染
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // 獲取第一個 default 節點
    const defaultNode = await page.locator('.angular-flow__node.type-default').first();
    
    if (await defaultNode.count() > 0) {
      // Default 節點應該有 source handle
      const sourceHandles = await defaultNode.locator('angular-flow-handle[type="source"]').count();
      expect(sourceHandles).toBeGreaterThan(0);
      
      // Default 節點應該有 target handle
      const targetHandles = await defaultNode.locator('angular-flow-handle[type="target"]').count();
      expect(targetHandles).toBeGreaterThan(0);
    }
  });

  test('node labels should display correct content', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點渲染
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // 檢查 input 節點標籤
    const inputNodeLabel = await page.locator('.angular-flow__node.type-input .angular-flow__node-label').first();
    if (await inputNodeLabel.count() > 0) {
      const inputText = await inputNodeLabel.textContent();
      expect(inputText).toContain('Input');
    }
    
    // 檢查 output 節點標籤
    const outputNodeLabel = await page.locator('.angular-flow__node.type-output .angular-flow__node-label').first();
    if (await outputNodeLabel.count() > 0) {
      const outputText = await outputNodeLabel.textContent();
      expect(outputText).toContain('Output');
    }
    
    // 檢查 default 節點標籤
    const defaultNodeLabel = await page.locator('.angular-flow__node.type-default .angular-flow__node-label').first();
    if (await defaultNodeLabel.count() > 0) {
      const defaultText = await defaultNodeLabel.textContent();
      expect(defaultText).toBeTruthy();
      expect(defaultText.length).toBeGreaterThan(0);
    }
  });

  test('edges should connect properly between different node types', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待邊線渲染
    await page.waitForSelector('.angular-flow__edge', { timeout: 5000 });
    
    // 檢查邊線數量
    const edgeCount = await page.locator('.angular-flow__edge').count();
    expect(edgeCount).toBe(4); // 根據我們設定的邊線數量
    
    // 檢查每條邊都有有效的路徑
    const edges = await page.locator('.angular-flow__edge-path').all();
    for (const edge of edges) {
      const pathData = await edge.getAttribute('d');
      expect(pathData).toBeTruthy();
      // 驗證路徑是貝茲曲線格式
      expect(pathData).toMatch(/^M\s*[\d.]+,[\d.]+\s+C/);
    }
  });
});