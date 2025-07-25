import { test, expect } from '@playwright/test';

/**
 * Angular XYFlow 完整版 Basic 範例測試
 * 對應 React Basic 範例的完整功能測試
 */
test.describe('Angular XYFlow Basic Example Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 導航到 Angular 應用
    await page.goto('http://localhost:4200');
    
    // 等待應用加載
    await page.waitForSelector('app-header');
  });

  test('should display header with navigation', async ({ page }) => {
    // 檢查 header 是否顯示
    await expect(page.locator('app-header')).toBeVisible();
    
    // 檢查 logo
    await expect(page.locator('.logo')).toBeVisible();
    await expect(page.locator('.logo')).toContainText('Angular XYFlow Dev');
    
    // 檢查選單
    await expect(page.locator('.route-selector')).toBeVisible();
    
    // 檢查選單中包含 Basic 選項
    const basicOption = page.locator('.route-selector option[value="basic"]');
    await expect(basicOption).toBeVisible();
    await expect(basicOption).toContainText('Basic');
  });

  test('should display Angular Flow Basic example', async ({ page }) => {
    // 等待 AngularFlow 組件加載
    await page.waitForSelector('xy-angular-flow');
    
    // 檢查主要組件是否存在
    await expect(page.locator('xy-angular-flow')).toBeVisible();
    await expect(page.locator('xy-background')).toBeVisible();
    await expect(page.locator('xy-minimap')).toBeVisible();
    await expect(page.locator('xy-controls')).toBeVisible();
    await expect(page.locator('xy-panel')).toBeVisible();
  });

  test('should render initial nodes', async ({ page }) => {
    // 等待節點渲染
    await page.waitForSelector('[data-testid="node"]', { timeout: 10000 });
    
    // 檢查初始節點數量 (應該有 4 個)
    const nodes = page.locator('[data-testid="node"]');
    await expect(nodes).toHaveCount(4);
    
    // 檢查特定節點的標籤
    await expect(page.locator('[data-testid="node"][data-id="1"]')).toContainText('Node 1');
    await expect(page.locator('[data-testid="node"][data-id="2"]')).toContainText('Node 2');
    await expect(page.locator('[data-testid="node"][data-id="3"]')).toContainText('Node 3');
    await expect(page.locator('[data-testid="node"][data-id="4"]')).toContainText('Node 4');
  });

  test('should render initial edges', async ({ page }) => {
    // 等待邊線渲染
    await page.waitForSelector('[data-testid="edge"]', { timeout: 10000 });
    
    // 檢查初始邊線數量 (應該有 2 條)
    const edges = page.locator('[data-testid="edge"]');
    await expect(edges).toHaveCount(2);
    
    // 檢查特定邊線
    await expect(page.locator('[data-testid="edge"][data-testid="e1-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="edge"][data-testid="e1-3"]')).toBeVisible();
  });

  test('should have working control panel buttons', async ({ page }) => {
    // 檢查控制面板中的所有按鈕
    const buttons = [
      'reset transform',
      'change pos',
      'toggle classnames',
      'toObject',
      'deleteSelectedElements',
      'deleteSomeElements',
      'setNodes',
      'updateNode',
      'addNode'
    ];

    for (const buttonText of buttons) {
      await expect(page.locator(`button:has-text("${buttonText}")`)).toBeVisible();
    }
  });

  test('should add new node when addNode button is clicked', async ({ page }) => {
    // 等待初始渲染
    await page.waitForSelector('[data-testid="node"]');
    
    // 計算初始節點數量
    const initialNodes = page.locator('[data-testid="node"]');
    await expect(initialNodes).toHaveCount(4);
    
    // 點擊添加節點按鈕
    await page.click('button:has-text("addNode")');
    
    // 驗證節點數量增加
    await expect(page.locator('[data-testid="node"]')).toHaveCount(5);
  });

  test('should update node positions when change pos button is clicked', async ({ page }) => {
    // 等待節點渲染
    await page.waitForSelector('[data-testid="node"][data-id="1"]');
    
    // 獲取第一個節點的初始位置
    const firstNode = page.locator('[data-testid="node"][data-id="1"]');
    const initialBox = await firstNode.boundingBox();
    
    // 點擊改變位置按鈕
    await page.click('button:has-text("change pos")');
    
    // 等待位置更新
    await page.waitForTimeout(500);
    
    // 獲取更新後的位置
    const updatedBox = await firstNode.boundingBox();
    
    // 驗證位置已改變
    expect(initialBox?.x).not.toBe(updatedBox?.x);
    expect(initialBox?.y).not.toBe(updatedBox?.y);
  });

  test('should toggle node classnames when toggle classnames button is clicked', async ({ page }) => {
    // 等待節點渲染
    await page.waitForSelector('[data-testid="node"]');
    
    // 點擊切換類名按鈕
    await page.click('button:has-text("toggle classnames")');
    
    // 驗證類名已改變 (這裡需要根據實際的類名實現來調整)
    // 例如檢查節點是否有 'dark' 類名而不是 'light'
    const firstNode = page.locator('[data-testid="node"]').first();
    await expect(firstNode).toHaveClass(/dark/);
  });

  test('should set new nodes when setNodes button is clicked', async ({ page }) => {
    // 等待初始渲染
    await page.waitForSelector('[data-testid="node"]');
    
    // 點擊設置節點按鈕
    await page.click('button:has-text("setNodes")');
    
    // 驗證節點數量變為 2
    await expect(page.locator('[data-testid="node"]')).toHaveCount(2);
    
    // 驗證新節點的標籤
    await expect(page.locator('[data-testid="node"][data-id="a"]')).toContainText('Node a');
    await expect(page.locator('[data-testid="node"][data-id="b"]')).toContainText('Node b');
    
    // 驗證新邊線
    await expect(page.locator('[data-testid="edge"][data-testid="a-b"]')).toBeVisible();
  });

  test('should update node data when updateNode button is clicked', async ({ page }) => {
    // 等待初始渲染
    await page.waitForSelector('[data-testid="node"][data-id="1"]');
    
    // 點擊更新節點按鈕
    await page.click('button:has-text("updateNode")');
    
    // 驗證節點標籤已更新
    await expect(page.locator('[data-testid="node"][data-id="1"]')).toContainText('update');
    await expect(page.locator('[data-testid="node"][data-id="2"]')).toContainText('update');
  });

  test('should delete some elements when deleteSomeElements button is clicked', async ({ page }) => {
    // 等待初始渲染
    await page.waitForSelector('[data-testid="node"]');
    
    // 點擊刪除某些元素按鈕
    await page.click('button:has-text("deleteSomeElements")');
    
    // 驗證節點 '2' 已被刪除
    await expect(page.locator('[data-testid="node"][data-id="2"]')).not.toBeVisible();
    
    // 驗證邊線 'e1-3' 已被刪除
    await expect(page.locator('[data-testid="edge"][data-testid="e1-3"]')).not.toBeVisible();
    
    // 驗證剩餘節點數量
    await expect(page.locator('[data-testid="node"]')).toHaveCount(3);
    await expect(page.locator('[data-testid="edge"]')).toHaveCount(1);
  });

  test('should reset transform when reset transform button is clicked', async ({ page }) => {
    // 等待渲染
    await page.waitForSelector('xy-angular-flow');
    
    // 先改變視窗位置/縮放 (模擬用戶操作)
    // 這裡可能需要根據實際的視窗實現來調整
    
    // 點擊重置變換按鈕
    await page.click('button:has-text("reset transform")');
    
    // 驗證視窗已重置 (這裡需要根據實際實現來驗證)
    // 例如檢查變換矩陣或視窗位置
  });

  test('should log object when toObject button is clicked', async ({ page }) => {
    // 監聽控制台日誌
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    // 點擊 toObject 按鈕
    await page.click('button:has-text("toObject")');
    
    // 驗證有控制台輸出
    expect(consoleLogs.length).toBeGreaterThan(0);
  });

  test('should support node interaction events', async ({ page }) => {
    // 監聽控制台日誌以驗證事件觸發
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    // 等待節點渲染
    await page.waitForSelector('[data-testid="node"]');
    
    // 點擊節點
    await page.click('[data-testid="node"]');
    
    // 驗證點擊事件被記錄
    expect(consoleLogs.some(log => log.includes('click'))).toBe(true);
  });

  test('should have proper styling and layout', async ({ page }) => {
    // 檢查主容器的樣式
    const angularFlow = page.locator('xy-angular-flow');
    await expect(angularFlow).toBeVisible();
    
    // 檢查容器具有正確的類名
    await expect(angularFlow).toHaveClass(/react-flow-basic-example/);
    
    // 檢查背景組件
    const background = page.locator('xy-background');
    await expect(background).toBeVisible();
    
    // 檢查控制面板按鈕的樣式
    const buttons = page.locator('.button-panel button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBe(9);
  });
});

test.describe('Angular XYFlow Basic Example - Advanced Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForSelector('xy-angular-flow');
  });

  test('should support node selection', async ({ page }) => {
    // 等待節點渲染
    await page.waitForSelector('[data-testid="node"]');
    
    // 選擇第一個節點
    await page.click('[data-testid="node"]');
    
    // 驗證節點已被選中 (根據實際選中狀態的實現調整)
    const selectedNode = page.locator('[data-testid="node"].selected');
    await expect(selectedNode).toBeVisible();
  });

  test('should support multiple element deletion', async ({ page }) => {
    // 等待渲染
    await page.waitForSelector('[data-testid="node"]');
    
    // 選擇一些節點 (模擬多選)
    await page.click('[data-testid="node"][data-id="1"]');
    await page.keyboard.down('Shift');
    await page.click('[data-testid="node"][data-id="2"]');
    await page.keyboard.up('Shift');
    
    // 點擊刪除選中元素按鈕
    await page.click('button:has-text("deleteSelectedElements")');
    
    // 驗證選中的節點已被刪除
    await expect(page.locator('[data-testid="node"][data-id="1"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="node"][data-id="2"]')).not.toBeVisible();
  });
});