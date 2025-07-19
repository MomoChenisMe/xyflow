import { test, expect } from '@playwright/test';

/**
 * 測試 React Flow 基本範例的節點連結功能
 * 確認 React 版本是否真的支持節點連結
 */

test.describe('React Flow Basic Example Connection Test', () => {
  test.beforeEach(async ({ page }) => {
    // 導航到 React 基本範例
    await page.goto('http://localhost:3000/basic');
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });
  });

  test('should test if React Flow basic example supports node connection', async ({ page }) => {
    // 檢查基本結構
    await expect(page.locator('.react-flow')).toBeVisible();
    await expect(page.locator('.react-flow__node')).toHaveCount(4);
    
    // 檢查初始邊數量
    const initialEdgeCount = await page.locator('.react-flow__edge-path').count();
    console.log('React - Initial edge count:', initialEdgeCount);
    
    // 檢查 handles 是否存在
    const handleCount = await page.locator('.react-flow__handle').count();
    console.log('React - Handle count:', handleCount);
    
    const sourceHandles = await page.locator('.react-flow__handle[data-handletype="source"]').count();
    const targetHandles = await page.locator('.react-flow__handle[data-handletype="target"]').count();
    
    console.log('React - Source handles:', sourceHandles);
    console.log('React - Target handles:', targetHandles);
    
    // 嘗試從 source handle 拖拽到 target handle
    const sourceHandle = page.locator('.react-flow__handle[data-handletype="source"]').first();
    const targetHandle = page.locator('.react-flow__handle[data-handletype="target"]').first();
    
    if (await sourceHandle.count() > 0 && await targetHandle.count() > 0) {
      const sourceBBox = await sourceHandle.boundingBox();
      const targetBBox = await targetHandle.boundingBox();
      
      if (sourceBBox && targetBBox) {
        console.log('React - Attempting connection...');
        
        await page.mouse.move(sourceBBox.x + sourceBBox.width / 2, sourceBBox.y + sourceBBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(targetBBox.x + targetBBox.width / 2, targetBBox.y + targetBBox.height / 2);
        await page.mouse.up();
        
        await page.waitForTimeout(500);
        
        // 檢查是否創建了新邊
        const finalEdgeCount = await page.locator('.react-flow__edge-path').count();
        console.log('React - Final edge count:', finalEdgeCount);
        
        if (finalEdgeCount > initialEdgeCount) {
          console.log('✅ React Flow supports node connection');
        } else {
          console.log('❌ React Flow basic example does NOT support node connection');
        }
      }
    }
  });

  test('should check React Flow onConnect handler', async ({ page }) => {
    // 檢查控制台日誌來確認是否有 onConnect 事件
    const logs: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });
    
    // 等待頁面載入
    await page.waitForTimeout(1000);
    
    // 檢查是否有與連接相關的日誌
    const connectionLogs = logs.filter(log => 
      log.includes('connect') || 
      log.includes('onConnect') || 
      log.includes('edge')
    );
    
    console.log('React - Connection related logs:', connectionLogs);
  });
});