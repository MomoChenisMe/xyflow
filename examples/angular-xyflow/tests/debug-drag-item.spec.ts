import { test, expect } from '@playwright/test';

test('Debug dragItem 結構', async ({ page }) => {
  let foundDragItem = false;
  
  // 監聽控制台消息
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('🔍 dragItem structure:')) {
      console.log('=== DragItem 結構 ===');
      console.log(text);
      foundDragItem = true;
    }
    if (text.includes('updateNodePositions called')) {
      console.log('updateNodePositions:', text);
    }
  });

  await page.goto('http://localhost:4200/examples/basic');
  await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // 執行一個簡單的拖拽
  const node = page.locator('.xy-flow__node').first();
  await node.hover();
  await page.mouse.down();
  await page.mouse.move(100, 100, { steps: 1 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  
  await page.waitForTimeout(1000);
  
  expect(foundDragItem).toBe(true);
});