import { test, expect } from '@playwright/test';

test.describe('React Flow Handle Debug', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/examples/Basic');
    await page.waitForSelector('[data-id="1"]', { timeout: 10000 });
  });

  test('should debug handle interaction step by step', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });

    // 檢查頁面是否已載入
    const node1 = page.locator('[data-id="1"]');
    const node2 = page.locator('[data-id="2"]');
    
    await expect(node1).toBeVisible();
    await expect(node2).toBeVisible();
    
    console.log('Nodes are visible');
    
    // 檢查 handles
    const sourceHandle = node1.locator('.react-flow__handle.source');
    await expect(sourceHandle).toBeVisible();
    
    console.log('Source handle is visible');
    
    // 檢查 handle 屬性
    const handleClass = await sourceHandle.getAttribute('class');
    const handleDataId = await sourceHandle.getAttribute('data-id');
    const handleNodeId = await sourceHandle.getAttribute('data-nodeid');
    
    console.log('Handle class:', handleClass);
    console.log('Handle data-id:', handleDataId);  
    console.log('Handle node-id:', handleNodeId);
    
    // 檢查初始連接狀態
    const connectionLine = page.locator('.react-flow__connectionline, .react-flow__connection-line');
    const initialConnectionVisible = await connectionLine.isVisible();
    console.log('Initial connection line visible:', initialConnectionVisible);
    
    // 開始拖拽
    console.log('Starting mousedown on source handle...');
    await sourceHandle.hover();
    await page.mouse.down();
    
    // 等待一下讓事件處理
    await page.waitForTimeout(100);
    
    // 檢查拖拽後的連接狀態
    const afterMouseDownConnectionVisible = await connectionLine.isVisible();
    console.log('Connection line visible after mousedown:', afterMouseDownConnectionVisible);
    
    // 檢查 handle 類名變化
    const handleClassAfter = await sourceHandle.getAttribute('class');
    console.log('Handle class after mousedown:', handleClassAfter);
    
    // 檢查頁面上是否有任何 SVG 元素
    const svgElements = await page.locator('svg').all();
    console.log('Number of SVG elements:', svgElements.length);
    
    for (let i = 0; i < svgElements.length; i++) {
      const svg = svgElements[i];
      const svgClass = await svg.getAttribute('class');
      const svgVisible = await svg.isVisible();
      console.log(`SVG ${i}: class=${svgClass}, visible=${svgVisible}`);
    }
    
    // 檢查 connection 相關的元素
    const connectionElements = await page.locator('[class*="connection"]').all();
    console.log('Number of connection-related elements:', connectionElements.length);
    
    // 移動鼠標
    const targetHandle = node2.locator('.react-flow__handle.target');
    await targetHandle.hover();
    await page.waitForTimeout(100);
    
    const duringDragConnectionVisible = await connectionLine.isVisible();
    console.log('Connection line visible during drag:', duringDragConnectionVisible);
    
    // 結束拖拽
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    console.log('All console logs from the page:', logs);
    
    // 最基本的測試 - handle 應該能響應 mousedown
    expect(handleClass).toContain('connectable');
  });
});