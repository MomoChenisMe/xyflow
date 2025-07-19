import { test, expect } from '@playwright/test';

/**
 * 基本功能檢查測試
 * 專門檢查關鍵功能是否正常工作
 */

test.describe('Basic Functionality Check', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });
  });

  test('should load and render basic structure', async ({ page }) => {
    // 檢查基本結構是否存在
    await expect(page.locator('.react-flow')).toBeVisible();
    await expect(page.locator('.react-flow__node')).toHaveCount(4);
    
    console.log('✅ Basic structure loaded');
  });

  test('should be able to click and select nodes', async ({ page }) => {
    // 測試節點點擊和選擇
    const firstNode = page.locator('.react-flow__node').first();
    
    await firstNode.click();
    await page.waitForTimeout(100);
    
    // 檢查是否有選中狀態
    const hasSelectedClass = await firstNode.evaluate(el => el.classList.contains('selected'));
    console.log('Node selected class:', hasSelectedClass);
    
    if (!hasSelectedClass) {
      console.log('❌ Node selection not working');
    } else {
      console.log('✅ Node selection working');
    }
  });

  test('should be able to drag nodes', async ({ page }) => {
    const firstNode = page.locator('.react-flow__node').first();
    
    // 獲取初始位置
    const initialStyle = await firstNode.getAttribute('style');
    console.log('Initial node style:', initialStyle);
    
    // 嘗試拖拽
    const nodeBBox = await firstNode.boundingBox();
    if (nodeBBox) {
      await page.mouse.move(nodeBBox.x + nodeBBox.width / 2, nodeBBox.y + nodeBBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(nodeBBox.x + 100, nodeBBox.y + 100);
      await page.mouse.up();
      
      await page.waitForTimeout(100);
      
      // 檢查位置是否改變
      const finalStyle = await firstNode.getAttribute('style');
      console.log('Final node style:', finalStyle);
      
      if (initialStyle === finalStyle) {
        console.log('❌ Node dragging not working');
      } else {
        console.log('✅ Node dragging working');
      }
    }
  });

  test('should be able to connect nodes via handles', async ({ page }) => {
    // 檢查 handles 是否存在
    const handles = await page.locator('.react-flow__handle').count();
    console.log('Number of handles found:', handles);
    
    if (handles === 0) {
      console.log('❌ No handles found');
      return;
    }
    
    // 嘗試連接節點
    const sourceHandle = page.locator('.react-flow__handle.source').first();
    const targetHandle = page.locator('.react-flow__handle.target').first();
    
    const sourceHandleExists = await sourceHandle.count() > 0;
    const targetHandleExists = await targetHandle.count() > 0;
    
    console.log('Source handle exists:', sourceHandleExists);
    console.log('Target handle exists:', targetHandleExists);
    
    if (!sourceHandleExists || !targetHandleExists) {
      console.log('❌ Handles missing');
      return;
    }
    
    // 獲取初始邊數量
    const initialEdgeCount = await page.locator('.react-flow__edge-path').count();
    console.log('Initial edge count:', initialEdgeCount);
    
    // 嘗試從 source handle 拖拽到 target handle
    const sourceBBox = await sourceHandle.boundingBox();
    const targetBBox = await targetHandle.boundingBox();
    
    if (sourceBBox && targetBBox) {
      await page.mouse.move(sourceBBox.x + sourceBBox.width / 2, sourceBBox.y + sourceBBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(targetBBox.x + targetBBox.width / 2, targetBBox.y + targetBBox.height / 2);
      await page.mouse.up();
      
      await page.waitForTimeout(500);
      
      // 檢查是否創建了新邊
      const finalEdgeCount = await page.locator('.react-flow__edge-path').count();
      console.log('Final edge count:', finalEdgeCount);
      
      if (finalEdgeCount > initialEdgeCount) {
        console.log('✅ Node connection working');
      } else {
        console.log('❌ Node connection not working');
      }
    }
  });

  test('should be able to pan the viewport', async ({ page }) => {
    const viewport = page.locator('.react-flow__viewport');
    const initialTransform = await viewport.getAttribute('style');
    console.log('Initial viewport transform:', initialTransform);
    
    // 在空白區域拖拽來平移 (使用 renderer 而不是 pane)
    await page.locator('.react-flow__renderer').hover({ position: { x: 50, y: 50 } });
    await page.mouse.down();
    await page.mouse.move(150, 150);
    await page.mouse.up();
    
    await page.waitForTimeout(100);
    
    const finalTransform = await viewport.getAttribute('style');
    console.log('Final viewport transform:', finalTransform);
    
    if (initialTransform === finalTransform) {
      console.log('❌ Viewport panning not working');
    } else {
      console.log('✅ Viewport panning working');
    }
  });

  test('should test control panel buttons', async ({ page }) => {
    // 測試 addNode 按鈕
    const addNodeButton = page.locator('button').filter({ hasText: 'addNode' });
    const buttonExists = await addNodeButton.count() > 0;
    
    console.log('Add node button exists:', buttonExists);
    
    if (buttonExists) {
      const initialNodeCount = await page.locator('.react-flow__node').count();
      console.log('Initial node count:', initialNodeCount);
      
      await addNodeButton.click();
      await page.waitForTimeout(500);
      
      const finalNodeCount = await page.locator('.react-flow__node').count();
      console.log('Final node count:', finalNodeCount);
      
      if (finalNodeCount > initialNodeCount) {
        console.log('✅ Add node button working');
      } else {
        console.log('❌ Add node button not working');
      }
    }
  });

  test('should check for console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // 執行一些基本操作
    await page.locator('.react-flow__node').first().click();
    await page.locator('button').filter({ hasText: 'addNode' }).click();
    
    await page.waitForTimeout(1000);
    
    if (errors.length > 0) {
      console.log('❌ Console errors found:');
      errors.forEach(error => console.log('  -', error));
    } else {
      console.log('✅ No console errors');
    }
  });
});