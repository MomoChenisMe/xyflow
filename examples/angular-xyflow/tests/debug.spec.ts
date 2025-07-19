import { test, expect } from '@playwright/test';

test.describe('Angular XYFlow Debug Tests', () => {
  test('should load the application - debug version', async ({ page }) => {
    // Set a longer timeout for debugging
    test.setTimeout(60000);
    
    // Navigate to the page
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-screenshot.png' });
    
    // Check if the page has loaded
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if there are any console errors
    page.on('console', (msg) => {
      console.log('Console:', msg.type(), msg.text());
    });
    
    // Check if the body has loaded
    await expect(page.locator('body')).toBeVisible();
  });
});