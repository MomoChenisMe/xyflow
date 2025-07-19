import { test, expect } from '@playwright/test';

test.describe('Minimal Angular App Test', () => {
  test('should load the minimal app', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForSelector('h1');
    
    // Check if the title is visible
    await expect(page.locator('h1')).toContainText('Angular XY Flow - 連接測試');
    
    // Check if the test container is visible
    await expect(page.locator('.test-container')).toBeVisible();
    
    // Check if the button is visible
    await expect(page.locator('button')).toBeVisible();
    
    // Check if the counter starts at 0
    await expect(page.locator('p').filter({ hasText: 'Counter:' })).toContainText('Counter: 0');
    
    // Click the button
    await page.locator('button').click();
    
    // Check if the counter increments
    await expect(page.locator('p').filter({ hasText: 'Counter:' })).toContainText('Counter: 1');
    
    // Click the button again
    await page.locator('button').click();
    
    // Check if the counter increments again
    await expect(page.locator('p').filter({ hasText: 'Counter:' })).toContainText('Counter: 2');
    
    console.log('✅ Minimal app test passed!');
  });
});