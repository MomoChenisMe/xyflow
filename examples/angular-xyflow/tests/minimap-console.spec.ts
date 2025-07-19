import { test } from '@playwright/test';

test.describe('MiniMap Console Logs', () => {
  test('capture minimap console logs', async ({ page }) => {
    // 監聽 console 訊息
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    // 等待組件初始化
    await page.waitForTimeout(3000);
    
    // 輸出所有收集到的 log
    console.log('=== Captured Console Logs ===');
    logs.forEach(log => console.log(log));
    console.log('=== End of Logs ===');
    
    // 過濾出 MiniMap 相關的 log
    const minimapLogs = logs.filter(log => log.includes('MiniMap'));
    console.log('\n=== MiniMap Related Logs ===');
    minimapLogs.forEach(log => console.log(log));
  });
});