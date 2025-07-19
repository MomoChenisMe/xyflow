import { test, expect } from '@playwright/test';

/**
 * Angular Flow 基本範例測試
 * 對應 React Flow 基本範例的功能測試
 * 
 * 這個測試套件驗證 Angular 實現與 React Flow 基本範例的功能對等性
 */

test.describe('Angular Flow Basic Example - Matching React Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render Angular Flow with React Flow structure', async ({ page }) => {
    // 檢查主要 React Flow 容器
    await expect(page.locator('.react-flow')).toBeVisible();
    await expect(page.locator('.react-flow-basic-example')).toBeVisible();
    
    // 檢查基本組件存在
    await expect(page.locator('.react-flow__renderer')).toBeVisible();
    await expect(page.locator('.react-flow__viewport')).toBeVisible();
    await expect(page.locator('.react-flow__pane')).toBeVisible();
  });

  test('should render 4 nodes and 2 edges exactly like React Flow', async ({ page }) => {
    // 等待內容載入
    await page.waitForSelector('.react-flow__node');
    
    // 檢查節點數量 - 與 React 範例完全一致
    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBe(4);
    
    // 檢查邊數量 - 與 React 範例完全一致
    const edgeCount = await page.locator('.react-flow__edge-path').count();
    expect(edgeCount).toBe(2);
    
    // 檢查節點內容 - 與 React 範例完全一致
    await expect(page.locator('.react-flow__node').nth(0)).toContainText('Node 1');
    await expect(page.locator('.react-flow__node').nth(1)).toContainText('Node 2');
    await expect(page.locator('.react-flow__node').nth(2)).toContainText('Node 3');
    await expect(page.locator('.react-flow__node').nth(3)).toContainText('Node 4');
  });

  test('should have handles on nodes like React Flow', async ({ page }) => {
    await page.waitForSelector('.react-flow__node');
    
    // 檢查 handles 存在
    const handleCount = await page.locator('.react-flow__handle').count();
    expect(handleCount).toBeGreaterThan(0);
    
    // 檢查有 source 和 target handles
    await expect(page.locator('.react-flow__handle.source')).toHaveCount(4); // 每個節點一個 source
    await expect(page.locator('.react-flow__handle.target')).toHaveCount(3); // input 節點沒有 target
  });

  test('should render Background, MiniMap, and Controls like React Flow', async ({ page }) => {
    // Background
    await expect(page.locator('.react-flow__background')).toBeVisible();
    
    // MiniMap
    await expect(page.locator('.react-flow__minimap')).toBeVisible();
    
    // Controls
    await expect(page.locator('.react-flow__controls')).toBeVisible();
  });

  test('should render control panel with buttons like React Flow', async ({ page }) => {
    // Panel 位於 top-right
    await expect(page.locator('.react-flow__panel.top.right')).toBeVisible();
    
    // 檢查所有控制按鈕存在 - 與 React 範例完全對應
    await expect(page.locator('button').filter({ hasText: 'reset transform' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'change pos' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'toggle classnames' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'toObject' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'deleteSelectedElements' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'deleteSomeElements' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'setNodes' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'updateNode' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'addNode' })).toBeVisible();
  });

  test('should select nodes by clicking like React Flow', async ({ page }) => {
    await page.waitForSelector('.react-flow__node');
    
    // 選擇第一個節點
    await page.locator('.react-flow__node').first().click();
    await expect(page.locator('.react-flow__node').first()).toHaveClass(/selected/);
    
    // 點擊空白處取消選擇
    await page.locator('.react-flow__pane').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('.react-flow__node').first()).not.toHaveClass(/selected/);
  });

  test('should select multiple nodes with Cmd/Ctrl+click like React Flow', async ({ page }) => {
    await page.waitForSelector('.react-flow__node');
    
    // 使用 Cmd/Ctrl 多選
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    
    await page.keyboard.down(modifier);
    await page.locator('.react-flow__node').first().click();
    await page.locator('.react-flow__node').nth(1).click();
    await page.keyboard.up(modifier);
    
    // 檢查兩個節點都被選中
    await expect(page.locator('.react-flow__node').first()).toHaveClass(/selected/);
    await expect(page.locator('.react-flow__node').nth(1)).toHaveClass(/selected/);
  });

  test('should drag nodes like React Flow', async ({ page }) => {
    await page.waitForSelector('.react-flow__node');
    
    const node = page.locator('.react-flow__node').first();
    const initialTransform = await node.getAttribute('style');
    
    // 拖拽節點
    await node.hover();
    await page.mouse.down();
    await page.mouse.move(100, 100);
    await page.mouse.up();
    
    const finalTransform = await node.getAttribute('style');
    expect(initialTransform).not.toBe(finalTransform);
  });

  test('should connect nodes via handles like React Flow', async ({ page }) => {
    await page.waitForSelector('.react-flow__node');
    
    const initialEdgeCount = await page.locator('.react-flow__edge-path').count();
    
    // 從 Node 3 的 source handle 拖拽到 Node 4 的 target handle
    const sourceHandle = page.locator('.react-flow__node').filter({ hasText: 'Node 3' }).locator('.react-flow__handle.source');
    const targetHandle = page.locator('.react-flow__node').filter({ hasText: 'Node 4' }).locator('.react-flow__handle.target');
    
    await sourceHandle.hover();
    await page.mouse.down();
    await targetHandle.hover();
    await page.mouse.up();
    
    // 檢查是否創建了新邊
    const finalEdgeCount = await page.locator('.react-flow__edge-path').count();
    expect(finalEdgeCount).toBe(initialEdgeCount + 1);
  });

  test('should delete selected elements with Backspace like React Flow', async ({ page }) => {
    await page.waitForSelector('.react-flow__node');
    
    // 選擇一個節點
    await page.locator('.react-flow__node').first().click();
    await expect(page.locator('.react-flow__node').first()).toHaveClass(/selected/);
    
    const initialNodeCount = await page.locator('.react-flow__node').count();
    
    // 按 Backspace 刪除
    await page.keyboard.press('Backspace');
    
    const finalNodeCount = await page.locator('.react-flow__node').count();
    expect(finalNodeCount).toBe(initialNodeCount - 1);
  });

  test('should pan the viewport like React Flow', async ({ page }) => {
    await page.waitForSelector('.react-flow__viewport');
    
    const viewport = page.locator('.react-flow__viewport');
    const initialTransform = await viewport.getAttribute('style');
    
    // 在空白區域拖拽來平移視口
    await page.locator('.react-flow__pane').hover({ position: { x: 50, y: 50 } });
    await page.mouse.down();
    await page.mouse.move(150, 150);
    await page.mouse.up();
    
    const finalTransform = await viewport.getAttribute('style');
    expect(initialTransform).not.toBe(finalTransform);
  });

  test('should zoom with mouse wheel like React Flow', async ({ page }) => {
    await page.waitForSelector('.react-flow__viewport');
    
    const viewport = page.locator('.react-flow__viewport');
    const initialTransform = await viewport.getAttribute('style');
    
    // 滾輪縮放
    await page.locator('.react-flow__pane').hover({ position: { x: 200, y: 200 } });
    await page.mouse.wheel(0, -100); // 向上滾動放大
    
    await page.waitForTimeout(100);
    
    const finalTransform = await viewport.getAttribute('style');
    expect(initialTransform).not.toBe(finalTransform);
  });

  test('should test control panel buttons like React Flow', async ({ page }) => {
    await page.waitForSelector('.react-flow__node');
    
    // 測試 addNode 按鈕
    const initialNodeCount = await page.locator('.react-flow__node').count();
    await page.locator('button').filter({ hasText: 'addNode' }).click();
    
    await page.waitForTimeout(500);
    const newNodeCount = await page.locator('.react-flow__node').count();
    expect(newNodeCount).toBe(initialNodeCount + 1);
    
    // 測試 reset transform 按鈕
    await page.locator('button').filter({ hasText: 'reset transform' }).click();
    
    // 測試 change pos 按鈕
    const beforePositions = await page.locator('.react-flow__node').evaluateAll(
      nodes => nodes.map(node => (node as HTMLElement).style.transform)
    );
    
    await page.locator('button').filter({ hasText: 'change pos' }).click();
    await page.waitForTimeout(100);
    
    const afterPositions = await page.locator('.react-flow__node').evaluateAll(
      nodes => nodes.map(node => (node as HTMLElement).style.transform)
    );
    
    expect(beforePositions).not.toEqual(afterPositions);
  });

  test('should test className toggle functionality like React Flow', async ({ page }) => {
    await page.waitForSelector('.react-flow__node');
    
    // 檢查初始類名
    const firstNode = page.locator('.react-flow__node').first();
    await expect(firstNode).toHaveClass(/light/);
    
    // 點擊 toggle classnames 按鈕
    await page.locator('button').filter({ hasText: 'toggle classnames' }).click();
    
    // 檢查類名是否改變
    await expect(firstNode).toHaveClass(/dark/);
  });

  test('should test deleteSomeElements functionality like React Flow', async ({ page }) => {
    await page.waitForSelector('.react-flow__node');
    
    const initialNodeCount = await page.locator('.react-flow__node').count();
    const initialEdgeCount = await page.locator('.react-flow__edge-path').count();
    
    // 點擊 deleteSomeElements 按鈕（應該刪除 Node 2 和 edge e1-3）
    await page.locator('button').filter({ hasText: 'deleteSomeElements' }).click();
    
    await page.waitForTimeout(200);
    
    const finalNodeCount = await page.locator('.react-flow__node').count();
    const finalEdgeCount = await page.locator('.react-flow__edge-path').count();
    
    // 應該刪除了一個節點和一個邊
    expect(finalNodeCount).toBe(initialNodeCount - 1);
    expect(finalEdgeCount).toBe(initialEdgeCount - 1);
    
    // 檢查 Node 2 不再存在
    await expect(page.locator('.react-flow__node').filter({ hasText: 'Node 2' })).toHaveCount(0);
  });

  test('should test setNodes functionality like React Flow', async ({ page }) => {
    await page.waitForSelector('.react-flow__node');
    
    // 點擊 setNodes 按鈕
    await page.locator('button').filter({ hasText: 'setNodes' }).click();
    
    await page.waitForTimeout(200);
    
    // 檢查是否設置了新節點
    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBe(2);
    
    // 檢查新節點的標籤
    await expect(page.locator('.react-flow__node').filter({ hasText: 'Node a' })).toBeVisible();
    await expect(page.locator('.react-flow__node').filter({ hasText: 'Node b' })).toBeVisible();
  });

  test('should verify edge animation like React Flow', async ({ page }) => {
    await page.waitForSelector('.react-flow__edge-path');
    
    // 檢查動畫邊是否存在（第一條邊應該有動畫）
    const animatedEdges = await page.locator('.react-flow__edge.animated .react-flow__edge-path').count();
    expect(animatedEdges).toBeGreaterThan(0);
  });

  test('should test console logging functionality', async ({ page }) => {
    let consoleMessages: string[] = [];
    
    // 監聽 console 訊息
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleMessages.push(msg.text());
      }
    });
    
    await page.waitForSelector('.react-flow__node');
    
    // 測試節點點擊
    await page.locator('.react-flow__node').first().click();
    
    // 測試 toObject 按鈕
    await page.locator('button').filter({ hasText: 'toObject' }).click();
    
    // 驗證 console 訊息
    expect(consoleMessages.some(msg => msg.includes('Node click:'))).toBe(true);
    expect(consoleMessages.some(msg => msg.includes('Flow object:'))).toBe(true);
  });
});