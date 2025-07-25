import { test, expect } from '@playwright/test';

test.describe('Angular Flow Connection Drag Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForTimeout(3000); // 等待 Angular 應用完全載入
  });

  test('should test drag connection between handles', async ({ page }) => {
    // 監聽控制台日誌
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // 找到節點和 handles
    const nodes = await page.locator('[data-id]').all();
    console.log('Number of nodes found:', nodes.length);
    
    if (nodes.length >= 2) {
      const node1 = nodes[0];
      const node2 = nodes[1];
      
      const node1Id = await node1.getAttribute('data-id');
      const node2Id = await node2.getAttribute('data-id');
      console.log('Testing connection from node', node1Id, 'to node', node2Id);
      
      // 找到 handles
      const sourceHandle = await node1.locator('xy-handle[type="source"], .xy-flow__handle.source').first();
      const targetHandle = await node2.locator('xy-handle[type="target"], .xy-flow__handle.target').first();
      
      const sourceVisible = await sourceHandle.isVisible();
      const targetVisible = await targetHandle.isVisible();
      
      console.log('Source handle visible:', sourceVisible);
      console.log('Target handle visible:', targetVisible);
      
      if (sourceVisible && targetVisible) {
        // 檢查初始連接線狀態
        const initialConnectionLines = await page.locator('.xy-flow__connection-line, .react-flow__connectionline').count();
        console.log('Initial connection lines:', initialConnectionLines);
        
        // 開始拖拽
        console.log('Starting drag from source handle...');
        await sourceHandle.hover();
        await page.mouse.down();
        
        // 等待一下並檢查連接線
        await page.waitForTimeout(200);
        const afterMouseDownConnectionLines = await page.locator('.xy-flow__connection-line, .react-flow__connectionline').count();
        console.log('Connection lines after mousedown:', afterMouseDownConnectionLines);
        
        // 移動到目標 handle
        console.log('Moving to target handle...');
        await targetHandle.hover();
        await page.waitForTimeout(100);
        
        // 檢查拖拽中的連接線
        const duringDragConnectionLines = await page.locator('.xy-flow__connection-line, .react-flow__connectionline').count();
        console.log('Connection lines during drag:', duringDragConnectionLines);
        
        // 釋放鼠標
        console.log('Releasing mouse...');
        await page.mouse.up();
        
        // 等待事件處理
        await page.waitForTimeout(500);
        
        // 檢查是否創建了新的邊線
        const edges = await page.locator('.xy-flow__edge, .react-flow__edge').count();
        console.log('Number of edges after connection:', edges);
        
        console.log('All console logs:', logs);
        
        // 基本驗證 - 至少在拖拽過程中應該有連接線
        expect(duringDragConnectionLines).toBeGreaterThan(initialConnectionLines);
      } else {
        console.log('Handles not visible, skipping drag test');
      }
    }
  });
});