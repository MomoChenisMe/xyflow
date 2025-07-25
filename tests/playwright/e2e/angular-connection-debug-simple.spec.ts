import { test, expect } from '@playwright/test';

test.describe('Angular Flow Connection Debug - Simple', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForTimeout(3000); // 等待 Angular 應用完全載入
  });

  test('should debug basic connection elements', async ({ page }) => {
    // 檢查頁面是否載入
    const appRoot = await page.locator('app-root').isVisible();
    console.log('App root visible:', appRoot);
    
    // 檢查是否有節點
    const nodes = await page.locator('[data-id]').all();
    console.log('Number of nodes found:', nodes.length);
    
    if (nodes.length > 0) {
      // 檢查第一個節點
      const firstNode = nodes[0];
      const nodeId = await firstNode.getAttribute('data-id');
      console.log('First node ID:', nodeId);
      
      // 檢查是否有 Handle
      const handles = await firstNode.locator('xy-handle, .react-flow__handle, .xy-flow__handle').all();
      console.log('Number of handles in first node:', handles.length);
      
      for (let i = 0; i < handles.length; i++) {
        const handle = handles[i];
        const handleClass = await handle.getAttribute('class');
        const handleType = await handle.getAttribute('data-handleid');
        console.log(`Handle ${i}:`, { class: handleClass, type: handleType });
      }
      
      // 嘗試點擊第一個 handle
      if (handles.length > 0) {
        const firstHandle = handles[0];
        console.log('Clicking first handle...');
        await firstHandle.click();
        
        // 等待一下看是否有反應
        await page.waitForTimeout(500);
        
        // 檢查是否有連接線出現
        const connectionLines = await page.locator('.xy-flow__connection-line, .react-flow__connectionline').all();
        console.log('Number of connection lines after click:', connectionLines.length);
      }
    }
    
    // 檢查控制台錯誤
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    
    if (logs.length > 0) {
      console.log('Console errors:', logs);
    }
    
    // 基本驗證 - 至少應該能找到一些節點
    expect(nodes.length).toBeGreaterThan(0);
  });
});