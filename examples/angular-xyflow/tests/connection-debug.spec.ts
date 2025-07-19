import { test, expect } from '@playwright/test';

/**
 * 節點連結功能調試測試
 * 詳細檢查連結過程中發生的事件
 */

test.describe('Node Connection Debug Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });
  });

  test('should debug node connection process', async ({ page }) => {
    const logs: string[] = [];
    
    // 監聽控制台日誌
    page.on('console', msg => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
        console.log('Console log:', msg.text());
      }
    });
    
    // 檢查初始狀態
    const initialEdgeCount = await page.locator('.react-flow__edge-path').count();
    console.log('Initial edge count:', initialEdgeCount);
    
    // 查找 handles
    const sourceHandles = page.locator('.react-flow__handle.source');
    const targetHandles = page.locator('.react-flow__handle.target');
    
    const sourceCount = await sourceHandles.count();
    const targetCount = await targetHandles.count();
    
    console.log('Source handles:', sourceCount);
    console.log('Target handles:', targetCount);
    
    if (sourceCount > 0 && targetCount > 0) {
      // 選擇 Node 3 的 source handle (index 2)
      const sourceHandle = sourceHandles.nth(2);
      // 選擇 Node 4 的 target handle (index 2)  
      const targetHandle = targetHandles.nth(2);
      
      // 檢查 handles 是否可見
      await expect(sourceHandle).toBeVisible();
      await expect(targetHandle).toBeVisible();
      
      // 獲取 handles 的詳細信息
      const sourceNodeId = await sourceHandle.getAttribute('data-nodeid');
      const targetNodeId = await targetHandle.getAttribute('data-nodeid');
      
      console.log('Source node ID:', sourceNodeId);
      console.log('Target node ID:', targetNodeId);
      
      // 獲取位置
      const sourceBBox = await sourceHandle.boundingBox();
      const targetBBox = await targetHandle.boundingBox();
      
      if (sourceBBox && targetBBox) {
        console.log('Source handle position:', sourceBBox);
        console.log('Target handle position:', targetBBox);
        
        // 清除之前的日誌
        logs.length = 0;
        
        // 執行連結操作
        console.log('Starting connection...');
        
        // 移動到 source handle
        await page.mouse.move(sourceBBox.x + sourceBBox.width / 2, sourceBBox.y + sourceBBox.height / 2);
        await page.waitForTimeout(100);
        
        // 按下滑鼠
        await page.mouse.down();
        await page.waitForTimeout(100);
        
        // 移動到 target handle
        await page.mouse.move(targetBBox.x + targetBBox.width / 2, targetBBox.y + targetBBox.height / 2);
        await page.waitForTimeout(100);
        
        // 釋放滑鼠
        await page.mouse.up();
        await page.waitForTimeout(500);
        
        // 檢查結果
        const finalEdgeCount = await page.locator('.react-flow__edge-path').count();
        console.log('Final edge count:', finalEdgeCount);
        
        // 檢查是否有連接相關的日誌
        const connectionLogs = logs.filter(log => 
          log.includes('onConnect') || 
          log.includes('connection') ||
          log.includes('Handle mousedown') ||
          log.includes('Stop connection')
        );
        
        console.log('Connection logs:', connectionLogs);
        
        if (finalEdgeCount > initialEdgeCount) {
          console.log('✅ Connection successful');
        } else {
          console.log('❌ Connection failed');
          console.log('All logs:', logs);
        }
      }
    }
  });
});