import { test, expect } from '@playwright/test';

test.describe('Handle Debug Test', () => {
  test('檢查所有console訊息和Handle初始化', async ({ page }) => {
    // 捕獲所有console訊息
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // 導航到頁面
    await page.goto('http://localhost:4200');
    
    // 等待頁面完全加載
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(3000); // 等待組件完全初始化
    
    console.log('All console messages:');
    consoleMessages.forEach(msg => console.log(msg));
    
    // 檢查是否有Handle初始化的訊息
    const handleInitMessages = consoleMessages.filter(msg => 
      msg.includes('Handle component initialized')
    );
    
    console.log('Handle init messages:', handleInitMessages);
    
    // 查找handle元素
    const sourceHandle = page.locator('[data-handleid="source"][data-nodeid="1"]').first();
    const targetHandle = page.locator('[data-handleid="target"][data-nodeid="2"]').first();
    
    await expect(sourceHandle).toBeVisible();
    await expect(targetHandle).toBeVisible();
    
    console.log('Handle elements found and visible');
    
    // 嘗試mousedown event on handle to see if onPointerDown is triggered
    console.log('Triggering mousedown on source handle...');
    await sourceHandle.dispatchEvent('mousedown', { button: 0 });
    
    await page.waitForTimeout(1000);
    
    console.log('Updated console messages after mousedown:');
    const recentMessages = consoleMessages.slice(-20);
    recentMessages.forEach(msg => console.log(msg)); // 顯示最近20條訊息
    
    // 檢查是否有Handle相關的訊息
    const handleMessages = consoleMessages.filter(msg => 
      msg.includes('Handle') || msg.includes('onPointerDown') || msg.includes('XYHandle')
    );
    
    console.log('All Handle-related messages:', handleMessages);
  });
});