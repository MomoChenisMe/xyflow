import { test, expect } from '@playwright/test';

test.describe('Angular Flow Viewport Dragging', () => {
  test.beforeEach(async ({ page }) => {
    // 啟動本地開發服務器並導航到Angular Flow範例
    await page.goto('http://localhost:4200');
    
    // 等待頁面完全加載
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(1000); // 等待組件完全初始化
  });

  test('應該能夠通過拖動來移動視窗', async ({ page }) => {
    // 監聽console.log事件來捕獲viewport變化
    const viewportChanges: any[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('Viewport changed:')) {
        const text = msg.text();
        // 解析viewport數據
        const match = text.match(/Viewport changed: (.+)/);
        if (match) {
          try {
            const viewportData = JSON.parse(match[1]);
            viewportChanges.push(viewportData);
          } catch (e) {
            // 忽略解析錯誤
          }
        }
      }
    });
    
    // 在空白區域進行拖動操作
    const pane = page.locator('.xy-flow__pane');
    await expect(pane).toBeVisible();
    
    // 獲取pane的位置
    const paneBox = await pane.boundingBox();
    expect(paneBox).toBeDefined();
    
    // 在pane的空白區域開始拖動（避開節點）
    const startX = paneBox!.x + 50;
    const startY = paneBox!.y + 50;
    const endX = startX + 100;
    const endY = startY + 100;
    
    console.log(`拖動操作: 從 (${startX}, ${startY}) 到 (${endX}, ${endY})`);
    
    // 執行拖動操作
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 10 });
    await page.mouse.up();
    
    // 等待一下讓事件完成
    await page.waitForTimeout(1000);
    
    console.log(`捕獲到的viewport變化: ${viewportChanges.length}`);
    
    // 驗證viewport確實發生了變化
    expect(viewportChanges.length).toBeGreaterThan(0);
    
    // 驗證viewport位置確實改變了
    if (viewportChanges.length > 0) {
      const firstChange = viewportChanges[0];
      const lastChange = viewportChanges[viewportChanges.length - 1];
      
      console.log(`第一個變化: x=${firstChange.x}, y=${firstChange.y}`);
      console.log(`最後變化: x=${lastChange.x}, y=${lastChange.y}`);
      
      // 檢查x或y座標是否有顯著變化
      const deltaX = Math.abs(lastChange.x - firstChange.x);
      const deltaY = Math.abs(lastChange.y - firstChange.y);
      
      console.log(`Viewport變化: deltaX=${deltaX}, deltaY=${deltaY}`);
      
      // 應該有顯著的位置變化
      expect(deltaX > 10 || deltaY > 10).toBeTruthy();
    }
  });

  test('應該顯示正確的拖動cursor', async ({ page }) => {
    const pane = page.locator('.xy-flow__pane');
    await expect(pane).toBeVisible();
    
    // 檢查在空白區域時cursor為grab
    const paneBox = await pane.boundingBox();
    expect(paneBox).toBeDefined();
    
    await page.mouse.move(paneBox!.x + 50, paneBox!.y + 50);
    
    // 檢查css cursor屬性
    const cursor = await pane.evaluate(el => window.getComputedStyle(el).cursor);
    console.log('Pane cursor:', cursor);
    
    // 應該是grab或default cursor
    expect(['grab', 'default', 'auto'].includes(cursor)).toBeTruthy();
  });

  test('console應該記錄viewport變化事件', async ({ page }) => {
    // 監聽console.log事件
    const messages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        messages.push(msg.text());
      }
    });
    
    // 執行拖動操作
    const pane = page.locator('.xy-flow__pane');
    const paneBox = await pane.boundingBox();
    expect(paneBox).toBeDefined();
    
    const startX = paneBox!.x + 50;
    const startY = paneBox!.y + 50;
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 50, startY + 50, { steps: 5 });
    await page.mouse.up();
    
    await page.waitForTimeout(1000);
    
    // 檢查console是否記錄了viewport相關事件
    const viewportMessages = messages.filter(msg => 
      msg.includes('Viewport changed') || 
      msg.includes('Move:') || 
      msg.includes('Move start') || 
      msg.includes('Move end')
    );
    
    console.log('Console messages:', messages);
    console.log('Viewport related messages:', viewportMessages);
    
    // 應該有viewport變化的log
    expect(viewportMessages.length).toBeGreaterThan(0);
  });
});