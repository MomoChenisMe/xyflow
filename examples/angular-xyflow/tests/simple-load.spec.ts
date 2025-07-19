import { test, expect } from '@playwright/test';

test.describe('Simple Load Test', () => {
  test('should load the application', async ({ page }) => {
    test.setTimeout(10000);
    
    await page.goto('/');
    
    // Check if the body loads
    await expect(page.locator('body')).toBeVisible();
    
    // Check if app-root loads
    await expect(page.locator('app-root')).toBeVisible();
    
    // Take a screenshot
    await page.screenshot({ path: 'app-loaded.png' });
  });
});