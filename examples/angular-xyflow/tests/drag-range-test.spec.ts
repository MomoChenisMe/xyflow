import { test, expect } from '@playwright/test';

test('拖拽範圍測試', async ({ page }) => {
  const logs: string[] = [];
  
  // 監聽控制台消息
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('getStoreItems debug')) {
      console.log('StoreItems debug:', text);
    }
  });

  await page.goto('http://localhost:4200/examples/basic');
  await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
  await page.waitForTimeout(2000); // 等待初始化

  console.log('=== 測試拖拽範圍 ===');
  
  // 獲取第一個節點
  const node = page.locator('.xy-flow__node').first();
  
  // 獲取初始位置
  const initialBox = await node.boundingBox();
  console.log('初始位置:', initialBox);
  
  // 執行大範圍拖拽（向右下移動 300px）
  await node.hover();
  await page.mouse.down();
  await page.waitForTimeout(100);
  
  // 移動到很遠的位置
  const targetX = initialBox!.x + 300;
  const targetY = initialBox!.y + 300;
  
  console.log(`拖拽到: (${targetX}, ${targetY})`);
  await page.mouse.move(targetX, targetY, { steps: 10 });
  await page.waitForTimeout(200);
  
  await page.mouse.up();
  await page.waitForTimeout(1000);
  
  // 檢查最終位置
  const finalBox = await node.boundingBox();
  console.log('最終位置:', finalBox);
  
  const xMoved = Math.abs(finalBox!.x - initialBox!.x);
  const yMoved = Math.abs(finalBox!.y - initialBox!.y);
  
  console.log(`X軸移動距離: ${xMoved}px`);
  console.log(`Y軸移動距離: ${yMoved}px`);
  
  // 驗證節點確實移動了很遠的距離（至少 200px）
  const movedFar = xMoved > 200 || yMoved > 200;
  console.log(`節點是否移動了大範圍: ${movedFar}`);
  
  // 如果節點被限制在小範圍內，移動距離會遠小於目標距離
  if (!movedFar) {
    console.log('⚠️ 節點似乎被限制在一個小範圍內！');
    console.log(`目標移動距離: 300px，實際移動: X=${xMoved}px, Y=${yMoved}px`);
  }
  
  expect(movedFar).toBe(true);
});